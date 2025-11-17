const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');

// Get all visits
exports.getAllVisits = async (req, res) => {
  try {
    const { patient_id, doctor_id, status, current_stage, from, to, limit = 100, offset = 0 } = req.query;
    
    let query = `
      SELECT v.*, 
             p.id as patient_id_data, p.full_name, p.phone, p.email, 
             p.date_of_birth, p.gender, p.blood_group, p.address
      FROM patient_visits v
      LEFT JOIN patients p ON v.patient_id = p.id
      WHERE 1=1
    `;
    let params = [];
    
    if (patient_id) {
      query += ' AND v.patient_id = ?';
      params.push(patient_id);
    }
    
    if (doctor_id) {
      query += ' AND v.doctor_id = ?';
      params.push(doctor_id);
    }
    
    if (status) {
      query += ' AND v.overall_status = ?';
      params.push(status);
    }
    
    if (current_stage) {
      query += ' AND v.current_stage = ?';
      params.push(current_stage);
    }
    
    // Date range filtering
    if (from) {
      query += ' AND v.visit_date >= ?';
      params.push(from);
    }
    
    if (to) {
      query += ' AND v.visit_date <= ?';
      params.push(to);
    }
    
    query += ' ORDER BY v.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const [visits] = await db.execute(query, params);
    
    // Transform visits to include patient object
    const visitsWithPatient = visits.map(visit => ({
      ...visit,
      patient: {
        id: visit.patient_id,
        full_name: visit.full_name,
        phone: visit.phone,
        email: visit.email,
        date_of_birth: visit.date_of_birth,
        gender: visit.gender,
        blood_group: visit.blood_group,
        address: visit.address
      }
    }));
    
    res.json({ visits: visitsWithPatient });
  } catch (error) {
    console.error('Get visits error:', error);
    console.error('Error details:', error.message);
    console.error('SQL State:', error.sqlState);
    res.status(500).json({ 
      error: 'Failed to fetch visits',
      details: error.message 
    });
  }
};

// Get single visit
exports.getVisit = async (req, res) => {
  try {
    const [visits] = await db.execute(
      `SELECT v.*, 
              p.full_name as patient_name, p.phone as patient_phone
       FROM patient_visits v
       LEFT JOIN patients p ON v.patient_id = p.id
       WHERE v.id = ?`,
      [req.params.id]
    );
    
    if (visits.length === 0) {
      return res.status(404).json({ error: 'Visit not found' });
    }
    
    res.json({ visit: visits[0] });
  } catch (error) {
    console.error('Get visit error:', error);
    res.status(500).json({ error: 'Failed to fetch visit' });
  }
};

// Create visit
exports.createVisit = async (req, res) => {
  try {
    const { 
      patient_id, appointment_id, visit_date, current_stage,
      overall_status, reception_status, reception_notes
    } = req.body;
    
    if (!patient_id) {
      return res.status(400).json({ error: 'Patient ID is required' });
    }
    
    const visitId = uuidv4();
    
    await db.execute(
      `INSERT INTO patient_visits (
        id, patient_id, appointment_id, visit_date, current_stage,
        overall_status, reception_status, reception_notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        visitId, patient_id, appointment_id || null, 
        visit_date || new Date().toISOString().split('T')[0],
        current_stage || 'reception',
        overall_status || 'Active',
        reception_status || 'Pending',
        reception_notes || null
      ]
    );
    
    // Log activity
    await db.execute(
      `INSERT INTO activity_logs (id, user_id, action, details) 
       VALUES (?, ?, ?, ?)`,
      [uuidv4(), req.user.id, 'visit.created', 
       JSON.stringify({ visit_id: visitId, patient_id })]
    );
    
    res.status(201).json({ 
      message: 'Visit created successfully',
      visitId 
    });
  } catch (error) {
    console.error('Create visit error:', error);
    console.error('Error message:', error.message);
    console.error('SQL State:', error.sqlState);
    console.error('SQL Message:', error.sqlMessage);
    res.status(500).json({ 
      error: 'Failed to create visit',
      details: error.message 
    });
  }
};

// Update visit
exports.updateVisit = async (req, res) => {
  try {
    const updates = [];
    const values = [];
    
    const allowedFields = [
      'current_stage', 'overall_status', 'reception_status', 'reception_notes',
      'reception_completed_at', 'nurse_status', 'nurse_notes', 'nurse_completed_at',
      'doctor_status', 'doctor_notes', 'doctor_completed_at', 'pharmacy_status',
      'pharmacy_notes', 'pharmacy_completed_at', 'lab_status', 'lab_notes',
      'lab_completed_at', 'billing_status', 'billing_notes', 'billing_completed_at'
    ];
    
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(req.body[field]);
      }
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    
    values.push(req.params.id);
    
    await db.execute(
      `UPDATE patient_visits SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    
    // Log activity
    await db.execute(
      `INSERT INTO activity_logs (id, user_id, action, details) 
       VALUES (?, ?, ?, ?)`,
      [uuidv4(), req.user.id, 'visit.updated', 
       JSON.stringify({ visit_id: req.params.id, updates: req.body })]
    );
    
    res.json({ message: 'Visit updated successfully' });
  } catch (error) {
    console.error('Update visit error:', error);
    res.status(500).json({ error: 'Failed to update visit' });
  }
};

// Delete visit
exports.deleteVisit = async (req, res) => {
  try {
    await db.execute('DELETE FROM patient_visits WHERE id = ?', [req.params.id]);
    
    // Log activity
    await db.execute(
      `INSERT INTO activity_logs (id, user_id, action, details) 
       VALUES (?, ?, ?, ?)`,
      [uuidv4(), req.user.id, 'visit.deleted', JSON.stringify({ visit_id: req.params.id })]
    );
    
    res.json({ message: 'Visit deleted successfully' });
  } catch (error) {
    console.error('Delete visit error:', error);
    res.status(500).json({ error: 'Failed to delete visit' });
  }
};
