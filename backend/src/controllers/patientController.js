const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');

// Get all patients
exports.getAllPatients = async (req, res) => {
  try {
    const { limit = 100, offset = 0, search = '', from, to } = req.query;
    
    let query = 'SELECT * FROM patients WHERE 1=1';
    let params = [];
    
    if (search) {
      query += ' AND (full_name LIKE ? OR phone LIKE ? OR email LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    
    // Date range filtering
    if (from) {
      query += ' AND created_at >= ?';
      params.push(from);
    }
    
    if (to) {
      query += ' AND created_at <= ?';
      params.push(to);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const [patients] = await db.execute(query, params);
    
    // Get total count with same filters
    let countQuery = 'SELECT COUNT(*) as total FROM patients WHERE 1=1';
    let countParams = [];
    
    if (search) {
      countQuery += ' AND (full_name LIKE ? OR phone LIKE ? OR email LIKE ?)';
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm, searchTerm);
    }
    
    if (from) {
      countQuery += ' AND created_at >= ?';
      countParams.push(from);
    }
    
    if (to) {
      countQuery += ' AND created_at <= ?';
      countParams.push(to);
    }
    
    const [countResult] = await db.execute(countQuery, countParams);
    
    res.json({ 
      patients,
      total: countResult[0].total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
};

// Get single patient
exports.getPatient = async (req, res) => {
  try {
    const [patients] = await db.execute(
      'SELECT * FROM patients WHERE id = ?',
      [req.params.id]
    );
    
    if (patients.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    // Get patient visits
    const [visits] = await db.execute(
      'SELECT * FROM patient_visits WHERE patient_id = ? ORDER BY visit_date DESC',
      [req.params.id]
    );
    
    res.json({ 
      patient: patients[0],
      visits
    });
  } catch (error) {
    console.error('Get patient error:', error);
    res.status(500).json({ error: 'Failed to fetch patient' });
  }
};

// Create patient
exports.createPatient = async (req, res) => {
  try {
    const { 
      full_name, date_of_birth, gender, phone, email, address, blood_group
    } = req.body;
    
    if (!full_name) {
      return res.status(400).json({ error: 'Full name is required' });
    }
    
    const patientId = uuidv4();
    
    await db.execute(
      `INSERT INTO patients (
        id, full_name, date_of_birth, gender, phone, email, address, blood_group
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        patientId, 
        full_name, 
        date_of_birth || null, 
        gender || null, 
        phone || null, 
        email || null, 
        address || null,
        blood_group || null
      ]
    );
    
    // Log activity
    await db.execute(
      `INSERT INTO activity_logs (id, user_id, action, details) 
       VALUES (?, ?, ?, ?)`,
      [uuidv4(), req.user.id, 'patient.created', JSON.stringify({ patient_id: patientId, full_name })]
    );
    
    // Emit real-time update
    if (global.emitUpdate) {
      global.emitUpdate('patients', 'patient:created', { id: patientId, full_name });
    }
    
    res.status(201).json({ 
      message: 'Patient created successfully',
      patientId 
    });
  } catch (error) {
    console.error('Create patient error:', error);
    console.error('Error details:', error.message);
    res.status(500).json({ error: 'Failed to create patient', details: error.message });
  }
};

// Update patient
exports.updatePatient = async (req, res) => {
  try {
    const { 
      full_name, date_of_birth, gender, phone, email, address, blood_group
    } = req.body;
    
    await db.execute(
      `UPDATE patients 
       SET full_name = ?, date_of_birth = ?, gender = ?, phone = ?, email = ?, 
           address = ?, blood_group = ?
       WHERE id = ?`,
      [
        full_name, 
        date_of_birth || null, 
        gender || null, 
        phone || null, 
        email || null, 
        address || null,
        blood_group || null,
        req.params.id
      ]
    );
    
    // Log activity
    await db.execute(
      `INSERT INTO activity_logs (id, user_id, action, details) 
       VALUES (?, ?, ?, ?)`,
      [uuidv4(), req.user.id, 'patient.updated', JSON.stringify({ patient_id: req.params.id })]
    );
    
    // Emit real-time update
    if (global.emitUpdate) {
      global.emitUpdate('patients', 'patient:updated', { id: req.params.id });
    }
    
    res.json({ message: 'Patient updated successfully' });
  } catch (error) {
    console.error('Update patient error:', error);
    console.error('Error details:', error.message);
    res.status(500).json({ error: 'Failed to update patient', details: error.message });
  }
};

// Delete patient
exports.deletePatient = async (req, res) => {
  try {
    await db.execute('DELETE FROM patients WHERE id = ?', [req.params.id]);
    
    // Log activity
    await db.execute(
      `INSERT INTO activity_logs (id, user_id, action, details) 
       VALUES (?, ?, ?, ?)`,
      [uuidv4(), req.user.id, 'patient.deleted', JSON.stringify({ patient_id: req.params.id })]
    );
    
    // Emit real-time update
    if (global.emitUpdate) {
      global.emitUpdate('patients', 'patient:deleted', { id: req.params.id });
    }
    
    res.json({ message: 'Patient deleted successfully' });
  } catch (error) {
    console.error('Delete patient error:', error);
    res.status(500).json({ error: 'Failed to delete patient' });
  }
};
