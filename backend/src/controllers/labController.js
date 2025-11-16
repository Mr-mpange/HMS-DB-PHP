const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');

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
    const { 
      patient_id, doctor_id, visit_id, test_name, test_type,
      priority, notes
    } = req.body;
    
    if (!patient_id || !test_name) {
      return res.status(400).json({ error: 'Patient ID and test name are required' });
    }
    
    const labTestId = uuidv4();
    
    await db.execute(
      `INSERT INTO lab_tests (
        id, patient_id, doctor_id, visit_id, test_name, test_type,
        priority, notes, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending')`,
      [labTestId, patient_id, doctor_id, visit_id, test_name, test_type,
       priority || 'Normal', notes]
    );
    
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
    const { status, notes } = req.body;
    
    const updateData = { status };
    if (status === 'Completed') {
      updateData.completed_date = new Date().toISOString();
    }
    
    await db.execute(
      `UPDATE lab_tests 
       SET status = ?, notes = ?, completed_date = ?
       WHERE id = ?`,
      [status, notes, updateData.completed_date || null, req.params.id]
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
    
    await db.execute(
      `INSERT INTO lab_results (
        id, lab_test_id, result_value, reference_range, unit,
        abnormal_flag, notes, technician_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [resultId, req.params.id, result_value, reference_range, unit,
       abnormal_flag || false, notes, req.user.id]
    );
    
    // Update lab test status to completed
    await db.execute(
      `UPDATE lab_tests 
       SET status = 'Completed', completed_date = NOW()
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
