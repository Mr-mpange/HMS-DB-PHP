const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');

// Get single prescription
exports.getPrescription = async (req, res) => {
  try {
    const [prescriptions] = await db.execute(
      `SELECT pr.*, 
              p.full_name as patient_name, p.phone as patient_phone,
              u.full_name as doctor_name
       FROM prescriptions pr
       LEFT JOIN patients p ON pr.patient_id = p.id
       LEFT JOIN users u ON pr.doctor_id = u.id
       WHERE pr.id = ?`,
      [req.params.id]
    );
    
    if (prescriptions.length === 0) {
      return res.status(404).json({ error: 'Prescription not found' });
    }
    
    const prescription = prescriptions[0];
    
    // Parse medications JSON
    try {
      prescription.medications = prescription.medications ? JSON.parse(prescription.medications) : [];
    } catch (e) {
      console.error('Error parsing medications JSON:', e);
      prescription.medications = [];
    }
    
    prescription.patient = {
      id: prescription.patient_id,
      full_name: prescription.patient_name,
      phone: prescription.patient_phone
    };
    
    prescription.doctor = {
      id: prescription.doctor_id,
      full_name: prescription.doctor_name
    };
    
    res.json({ prescription });
  } catch (error) {
    console.error('Get prescription error:', error);
    res.status(500).json({ error: 'Failed to fetch prescription' });
  }
};

exports.getAllPrescriptions = async (req, res) => {
  try {
    const { patient_id, doctor_id, status, limit = 100, offset = 0 } = req.query;
    
    let query = `
      SELECT pr.*, 
             p.full_name as patient_name, p.phone as patient_phone,
             u.full_name as doctor_name
      FROM prescriptions pr
      LEFT JOIN patients p ON pr.patient_id = p.id
      LEFT JOIN users u ON pr.doctor_id = u.id
      WHERE 1=1
    `;
    let params = [];
    
    if (patient_id) {
      query += ' AND pr.patient_id = ?';
      params.push(patient_id);
    }
    
    if (doctor_id) {
      query += ' AND pr.doctor_id = ?';
      params.push(doctor_id);
    }
    
    if (status) {
      query += ' AND pr.status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY pr.prescription_date DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const [prescriptions] = await db.execute(query, params);
    
    // Parse medications JSON for each prescription
    const prescriptionsWithParsedMeds = prescriptions.map(presc => {
      try {
        return {
          ...presc,
          medications: presc.medications ? JSON.parse(presc.medications) : [],
          patient: {
            id: presc.patient_id,
            full_name: presc.patient_name,
            phone: presc.patient_phone
          },
          doctor: {
            id: presc.doctor_id,
            full_name: presc.doctor_name
          }
        };
      } catch (e) {
        console.error('Error parsing medications JSON:', e);
        return {
          ...presc,
          medications: [],
          patient: {
            id: presc.patient_id,
            full_name: presc.patient_name,
            phone: presc.patient_phone
          },
          doctor: {
            id: presc.doctor_id,
            full_name: presc.doctor_name
          }
        };
      }
    });
    
    res.json({ prescriptions: prescriptionsWithParsedMeds });
  } catch (error) {
    console.error('Get prescriptions error:', error);
    res.status(500).json({ error: 'Failed to fetch prescriptions' });
  }
};

exports.createPrescription = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Check if this is a batch request (array of prescriptions)
    const prescriptions = req.body.prescriptions || [req.body];
    
    if (!Array.isArray(prescriptions) || prescriptions.length === 0) {
      return res.status(400).json({ error: 'Invalid prescription data' });
    }
    
    console.log('Creating prescriptions:', prescriptions.length);
    
    // Group prescriptions by patient (in case multiple patients, though usually one)
    const groupedByPatient = prescriptions.reduce((acc, presc) => {
      const patientId = presc.patient_id;
      if (!acc[patientId]) {
        acc[patientId] = {
          patient_id: patientId,
          doctor_id: presc.doctor_id || req.user.id,
          visit_id: presc.visit_id || null,
          instructions: presc.instructions || null,
          medications: []
        };
      }
      
      acc[patientId].medications.push({
        medication_id: presc.medication_id,
        medication_name: presc.medication_name,
        dosage: presc.dosage,
        frequency: presc.frequency,
        duration: presc.duration,
        quantity: parseInt(presc.quantity),
        instructions: presc.instructions || null
      });
      
      return acc;
    }, {});
    
    const createdIds = [];
    
    // Create one prescription record per patient with all medications as JSON
    for (const [patientId, prescData] of Object.entries(groupedByPatient)) {
      const prescriptionId = uuidv4();
      
      // Convert medications array to JSON string
      const medicationsJson = JSON.stringify(prescData.medications);
      
      await connection.execute(
        `INSERT INTO prescriptions (
          id, patient_id, doctor_id, visit_id, prescription_date,
          medications, instructions, status
        ) VALUES (?, ?, ?, ?, CURDATE(), ?, ?, 'Active')`,
        [
          prescriptionId, 
          patientId, 
          prescData.doctor_id, 
          prescData.visit_id,
          medicationsJson,
          prescData.instructions
        ]
      );
      
      createdIds.push(prescriptionId);
      console.log('Created prescription:', prescriptionId, 'with', prescData.medications.length, 'medications');
    }
    
    // Log activity
    await connection.execute(
      `INSERT INTO activity_logs (id, user_id, action, details) 
       VALUES (?, ?, ?, ?)`,
      [uuidv4(), req.user.id, 'prescription.created', 
       JSON.stringify({ 
         prescription_count: createdIds.length,
         medication_count: prescriptions.length,
         prescription_ids: createdIds,
         patient_id: prescriptions[0].patient_id 
       })]
    );
    
    await connection.commit();
    
    // Emit real-time update
    if (global.emitUpdate) {
      global.emitUpdate('prescriptions', 'prescription:created', { 
        ids: createdIds,
        count: prescriptions.length 
      });
    }
    
    res.status(201).json({ 
      message: `Prescription created with ${prescriptions.length} medication(s)`,
      prescriptionIds: createdIds,
      medicationCount: prescriptions.length
    });
  } catch (error) {
    await connection.rollback();
    console.error('Create prescription error:', error);
    console.error('Error details:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to create prescription',
      details: error.message 
    });
  } finally {
    connection.release();
  }
};

exports.updatePrescription = async (req, res) => {
  try {
    const { status, notes } = req.body;
    
    // Build dynamic update query based on provided fields
    const updates = [];
    const values = [];
    
    if (status !== undefined) {
      updates.push('status = ?');
      values.push(status);
    }
    
    if (notes !== undefined) {
      updates.push('instructions = ?');
      values.push(notes);
    }
    
    // Check if we have any fields to update
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    // Always update the updated_at timestamp
    updates.push('updated_at = CURRENT_TIMESTAMP');
    
    values.push(req.params.id);
    
    await db.execute(
      `UPDATE prescriptions SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    
    await db.execute(
      `INSERT INTO activity_logs (id, user_id, action, details) 
       VALUES (?, ?, ?, ?)`,
      [uuidv4(), req.user.id, 'prescription.updated', 
       JSON.stringify({ prescription_id: req.params.id, status, updated_by: req.user.id })]
    );
    
    if (global.emitUpdate) {
      global.emitUpdate('prescriptions', 'prescription:updated', { id: req.params.id, status });
    }
    
    res.json({ message: 'Prescription updated' });
  } catch (error) {
    console.error('Update prescription error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to update prescription',
      details: error.message 
    });
  }
};
