const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');

exports.getAllPrescriptions = async (req, res) => {
  try {
    const { patient_id, doctor_id, status, limit = 100, offset = 0 } = req.query;
    
    let query = `
      SELECT pr.*, 
             p.full_name as patient_name,
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
    res.json({ prescriptions });
  } catch (error) {
    console.error('Get prescriptions error:', error);
    res.status(500).json({ error: 'Failed to fetch prescriptions' });
  }
};

exports.createPrescription = async (req, res) => {
  try {
    const { 
      patient_id, doctor_id, visit_id, medication_id, medication_name,
      dosage, frequency, duration, quantity, instructions
    } = req.body;
    
    const prescriptionId = uuidv4();
    
    await db.execute(
      `INSERT INTO prescriptions (
        id, patient_id, doctor_id, visit_id, medication_id, medication_name,
        dosage, frequency, duration, quantity, instructions, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending')`,
      [prescriptionId, patient_id, doctor_id, visit_id, medication_id, medication_name,
       dosage, frequency, duration, quantity, instructions]
    );
    
    await db.execute(
      `INSERT INTO activity_logs (id, user_id, action, details) 
       VALUES (?, ?, ?, ?)`,
      [uuidv4(), req.user.id, 'prescription.created', 
       JSON.stringify({ prescription_id: prescriptionId, patient_id, medication_name })]
    );
    
    if (global.emitUpdate) {
      global.emitUpdate('prescriptions', 'prescription:created', { id: prescriptionId });
    }
    
    res.status(201).json({ message: 'Prescription created', prescriptionId });
  } catch (error) {
    console.error('Create prescription error:', error);
    res.status(500).json({ error: 'Failed to create prescription' });
  }
};

exports.updatePrescription = async (req, res) => {
  try {
    const { status, dispensed_date } = req.body;
    
    await db.execute(
      'UPDATE prescriptions SET status = ?, dispensed_date = ? WHERE id = ?',
      [status, dispensed_date, req.params.id]
    );
    
    await db.execute(
      `INSERT INTO activity_logs (id, user_id, action, details) 
       VALUES (?, ?, ?, ?)`,
      [uuidv4(), req.user.id, 'prescription.updated', 
       JSON.stringify({ prescription_id: req.params.id, status })]
    );
    
    if (global.emitUpdate) {
      global.emitUpdate('prescriptions', 'prescription:updated', { id: req.params.id, status });
    }
    
    res.json({ message: 'Prescription updated' });
  } catch (error) {
    console.error('Update prescription error:', error);
    res.status(500).json({ error: 'Failed to update prescription' });
  }
};
