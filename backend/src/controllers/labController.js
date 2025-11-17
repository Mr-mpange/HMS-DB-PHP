const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');

// Get available lab services from medical_services catalog
exports.getAvailableLabServices = async (req, res) => {
  try {
    const [services] = await db.execute(`
      SELECT 
        id,
        service_code,
        service_name,
        service_type,
        description,
        base_price as price,
        currency
      FROM medical_services
      WHERE is_active = TRUE
        AND (service_type LIKE '%lab%' 
          OR service_type LIKE '%test%'
          OR service_type LIKE '%diagnostic%'
          OR service_type LIKE '%xray%'
          OR service_type LIKE '%scan%')
      ORDER BY service_name
    `);
    
    res.json({ services });
  } catch (error) {
    console.error('Get lab services error:', error);
    res.status(500).json({ error: 'Failed to fetch lab services' });
  }
};

// Get all lab tests
exports.getAllLabTests = async (req, res) => {
  try {
    const { patient_id, doctor_id, status, priority, limit = 100, offset = 0 } = req.query;
    
    let query = `
      SELECT lt.*, 
             p.full_name as patient_name, p.phone as patient_phone,
             u.full_name as doctor_name
      FROM lab_tests lt
      LEFT JOIN patients p ON lt.patient_id = p.id
      LEFT JOIN users u ON lt.doctor_id = u.id
      WHERE 1=1
    `;
    let params = [];
    
    if (patient_id) {
      query += ' AND lt.patient_id = ?';
      params.push(patient_id);
    }
    
    if (doctor_id) {
      query += ' AND lt.doctor_id = ?';
      params.push(doctor_id);
    }
    
    if (status) {
      query += ' AND lt.status = ?';
      params.push(status);
    }
    
    if (priority) {
      query += ' AND lt.priority = ?';
      params.push(priority);
    }
    
    query += ' ORDER BY lt.ordered_date DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const [labTests] = await db.execute(query, params);
    
    // Transform to include nested patient and doctor objects
    const labTestsWithRelations = labTests.map(test => ({
      ...test,
      patient: test.patient_name ? {
        id: test.patient_id,
        full_name: test.patient_name,
        phone: test.patient_phone
      } : null,
      doctor: test.doctor_name ? {
        id: test.doctor_id,
        full_name: test.doctor_name
      } : null
    }));
    
    res.json({ labTests: labTestsWithRelations });
  } catch (error) {
    console.error('Get lab tests error:', error);
    res.status(500).json({ error: 'Failed to fetch lab tests' });
  }
};

// Get single lab test with results
exports.getLabTest = async (req, res) => {
  try {
    const [labTests] = await db.execute(
      `SELECT lt.*, 
              p.full_name as patient_name, p.phone as patient_phone,
              u.full_name as doctor_name
       FROM lab_tests lt
       LEFT JOIN patients p ON lt.patient_id = p.id
       LEFT JOIN users u ON lt.doctor_id = u.id
       WHERE lt.id = ?`,
      [req.params.id]
    );
    
    if (labTests.length === 0) {
      return res.status(404).json({ error: 'Lab test not found' });
    }
    
    // Get results
    const [results] = await db.execute(
      `SELECT lr.*, u.full_name as technician_name
       FROM lab_results lr
       LEFT JOIN users u ON lr.technician_id = u.id
       WHERE lr.lab_test_id = ?`,
      [req.params.id]
    );
    
    res.json({ 
      labTest: labTests[0],
      results: results[0] || null
    });
  } catch (error) {
    console.error('Get lab test error:', error);
    res.status(500).json({ error: 'Failed to fetch lab test' });
  }
};

// Create lab test order
exports.createLabTest = async (req, res) => {
  try {
    console.log('Creating lab test with body:', req.body);
    
    const { 
      patient_id, doctor_id, visit_id, test_name, test_type, service_id,
      priority, instructions, notes, ordered_date, status
    } = req.body;
    
    if (!patient_id || !test_name) {
      console.log('Missing required fields:', { patient_id, test_name });
      return res.status(400).json({ error: 'Patient ID and test name are required' });
    }
    
    const labTestId = uuidv4();
    const instructionsText = instructions || notes || null;
    const testPriority = priority || 'Routine';
    const testStatus = status || 'Ordered';
    const orderDate = ordered_date || new Date();
    
    console.log('Inserting lab test:', {
      labTestId,
      patient_id,
      doctor_id,
      test_name,
      test_type,
      service_id,
      testPriority,
      testStatus
    });
    
    await db.execute(
      `INSERT INTO lab_tests (
        id, patient_id, doctor_id, visit_id, test_name, test_type, service_id,
        ordered_date, priority, instructions, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [labTestId, patient_id, doctor_id || null, visit_id || null, 
       test_name, test_type || null, service_id || null, orderDate, testPriority, instructionsText, testStatus]
    );
    
    console.log('Lab test created successfully:', labTestId);
    
    // Log activity
    await db.execute(
      `INSERT INTO activity_logs (id, user_id, action, details) 
       VALUES (?, ?, ?, ?)`,
      [uuidv4(), req.user.id, 'lab.test.ordered', 
       JSON.stringify({ lab_test_id: labTestId, patient_id, test_name })]
    );
    
    // Emit real-time update
    if (global.emitUpdate) {
      global.emitUpdate('lab_tests', 'lab_test:created', { id: labTestId });
    }
    
    res.status(201).json({ 
      message: 'Lab test ordered successfully',
      labTestId 
    });
  } catch (error) {
    console.error('Create lab test error:', error);
    res.status(500).json({ error: 'Failed to create lab test' });
  }
};

// Update lab test status
exports.updateLabTest = async (req, res) => {
  try {
    const { status, instructions, sample_collected } = req.body;
    
    // Build update query dynamically based on provided fields
    let updateFields = ['status = ?'];
    let updateValues = [status];
    
    if (instructions !== undefined) {
      updateFields.push('instructions = ?');
      updateValues.push(instructions);
    }
    
    if (sample_collected !== undefined) {
      updateFields.push('sample_collected = ?');
      updateValues.push(sample_collected ? 1 : 0);
    }
    
    // Add updated_at timestamp
    updateFields.push('updated_at = NOW()');
    
    // Add the id parameter at the end
    updateValues.push(req.params.id);
    
    await db.execute(
      `UPDATE lab_tests 
       SET ${updateFields.join(', ')}
       WHERE id = ?`,
      updateValues
    );
    
    // Log activity
    await db.execute(
      `INSERT INTO activity_logs (id, user_id, action, details) 
       VALUES (?, ?, ?, ?)`,
      [uuidv4(), req.user.id, 'lab.test.updated', 
       JSON.stringify({ lab_test_id: req.params.id, status })]
    );
    
    // Emit real-time update
    if (global.emitUpdate) {
      global.emitUpdate('lab_tests', 'lab_test:updated', { id: req.params.id, status });
    }
    
    res.json({ message: 'Lab test updated successfully' });
  } catch (error) {
    console.error('Update lab test error:', error);
    res.status(500).json({ error: 'Failed to update lab test' });
  }
};

// Add lab results
exports.addLabResults = async (req, res) => {
  try {
    const { 
      result_value, reference_range, unit, abnormal_flag, notes
    } = req.body;
    
    if (!result_value) {
      return res.status(400).json({ error: 'Result value is required' });
    }
    
    const resultId = uuidv4();
    
    // Prepare result data as JSON
    const resultData = JSON.stringify({
      value: result_value,
      reference_range: reference_range || null,
      unit: unit || null,
      abnormal_flag: abnormal_flag || false
    });
    
    await db.execute(
      `INSERT INTO lab_results (
        id, lab_test_id, result_data, result_text, notes,
        performed_by, performed_date
      ) VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [resultId, req.params.id, resultData, result_value, notes || null, req.user.id]
    );
    
    // Update lab test status to completed
    await db.execute(
      `UPDATE lab_tests 
       SET status = 'Completed', updated_at = NOW()
       WHERE id = ?`,
      [req.params.id]
    );
    
    // Log activity
    await db.execute(
      `INSERT INTO activity_logs (id, user_id, action, details) 
       VALUES (?, ?, ?, ?)`,
      [uuidv4(), req.user.id, 'lab.results.entered', 
       JSON.stringify({ lab_test_id: req.params.id, result_id: resultId })]
    );
    
    // Emit real-time update
    if (global.emitUpdate) {
      global.emitUpdate('lab_tests', 'lab_results:added', { 
        lab_test_id: req.params.id,
        result_id: resultId 
      });
    }
    
    res.status(201).json({ 
      message: 'Lab results added successfully',
      resultId 
    });
  } catch (error) {
    console.error('Add lab results error:', error);
    res.status(500).json({ error: 'Failed to add lab results' });
  }
};

// Get lab results
exports.getLabResults = async (req, res) => {
  try {
    const [results] = await db.execute(
      `SELECT lr.*, 
              lt.test_name, lt.test_type,
              p.full_name as patient_name,
              u.full_name as technician_name
       FROM lab_results lr
       LEFT JOIN lab_tests lt ON lr.lab_test_id = lt.id
       LEFT JOIN patients p ON lt.patient_id = p.id
       LEFT JOIN users u ON lr.technician_id = u.id
       WHERE lr.lab_test_id = ?`,
      [req.params.id]
    );
    
    res.json({ results: results[0] || null });
  } catch (error) {
    console.error('Get lab results error:', error);
    res.status(500).json({ error: 'Failed to fetch lab results' });
  }
};

// Add batch lab results
exports.addBatchLabResults = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { results, testIds } = req.body;
    
    if (!results || !Array.isArray(results) || results.length === 0) {
      return res.status(400).json({ error: 'Results array is required' });
    }
    
    console.log('Adding batch lab results:', { count: results.length, testIds });
    
    // Insert all results
    for (const result of results) {
      const { lab_test_id, result_value, reference_range, unit, abnormal_flag, notes } = result;
      
      if (!lab_test_id || !result_value) {
        throw new Error('Lab test ID and result value are required for each result');
      }
      
      const resultId = uuidv4();
      
      // Prepare result data as JSON
      const resultData = JSON.stringify({
        value: result_value,
        reference_range: reference_range || null,
        unit: unit || null,
        abnormal_flag: abnormal_flag || false
      });
      
      await connection.execute(
        `INSERT INTO lab_results (
          id, lab_test_id, result_data, result_text, notes, 
          performed_by, performed_date
        ) VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [resultId, lab_test_id, resultData, result_value, notes || null, req.user.id]
      );
      
      // Update lab test status to completed
      await connection.execute(
        `UPDATE lab_tests 
         SET status = 'Completed', updated_at = NOW()
         WHERE id = ?`,
        [lab_test_id]
      );
    }
    
    // Log activity
    await connection.execute(
      `INSERT INTO activity_logs (id, user_id, action, details) 
       VALUES (?, ?, ?, ?)`,
      [uuidv4(), req.user.id, 'lab.batch_results.entered', 
       JSON.stringify({ test_count: results.length, test_ids: testIds })]
    );
    
    await connection.commit();
    
    // Emit real-time update
    if (global.emitUpdate) {
      global.emitUpdate('lab_tests', 'lab_results:batch_added', { 
        test_ids: testIds,
        count: results.length
      });
    }
    
    res.status(201).json({ 
      message: `${results.length} lab results added successfully`,
      count: results.length
    });
  } catch (error) {
    await connection.rollback();
    console.error('Add batch lab results error:', error);
    res.status(500).json({ error: 'Failed to add batch lab results', details: error.message });
  } finally {
    connection.release();
  }
};
