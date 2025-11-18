const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');

// Get all patient services
exports.getAllPatientServices = async (req, res) => {
  try {
    const { status, patient_id, limit = 100, offset = 0 } = req.query;
    
    let query = `
      SELECT ps.*, 
             p.full_name as patient_name, p.phone as patient_phone,
             s.service_name, s.service_code, s.service_type, s.currency
      FROM patient_services ps
      LEFT JOIN patients p ON ps.patient_id = p.id
      LEFT JOIN medical_services s ON ps.service_id = s.id
      WHERE 1=1
    `;
    let params = [];
    
    if (status) {
      query += ' AND ps.status = ?';
      params.push(status);
    }
    
    if (patient_id) {
      query += ' AND ps.patient_id = ?';
      params.push(patient_id);
    }
    
    query += ' ORDER BY ps.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const [services] = await db.execute(query, params);
    
    res.json({ services });
  } catch (error) {
    console.error('Get patient services error:', error);
    res.status(500).json({ error: 'Failed to fetch patient services' });
  }
};

// Get services for a specific patient
exports.getPatientServices = async (req, res) => {
  try {
    const [services] = await db.execute(
      `SELECT ps.*, 
              s.service_name, s.service_code, s.service_type, s.currency
       FROM patient_services ps
       LEFT JOIN medical_services s ON ps.service_id = s.id
       WHERE ps.patient_id = ?
       ORDER BY ps.created_at DESC`,
      [req.params.patientId]
    );
    
    res.json({ services });
  } catch (error) {
    console.error('Get patient services error:', error);
    res.status(500).json({ error: 'Failed to fetch patient services' });
  }
};

// Get pending services (for nurse queue)
exports.getPendingServices = async (req, res) => {
  try {
    const [services] = await db.execute(
      `SELECT ps.*, 
              p.full_name as patient_name, p.phone as patient_phone, p.date_of_birth,
              s.service_name, s.service_code, s.service_type, s.currency
       FROM patient_services ps
       LEFT JOIN patients p ON ps.patient_id = p.id
       LEFT JOIN medical_services s ON ps.service_id = s.id
       WHERE ps.status = 'Pending'
       ORDER BY ps.created_at ASC`
    );
    
    res.json({ services });
  } catch (error) {
    console.error('Get pending services error:', error);
    res.status(500).json({ error: 'Failed to fetch pending services' });
  }
};

// Create patient service
exports.createPatientService = async (req, res) => {
  try {
    const { 
      patient_id, service_id, quantity, unit_price, total_price, 
      service_date, status, notes 
    } = req.body;
    
    if (!patient_id || !service_id || !quantity || !unit_price) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const serviceId = uuidv4();
    
    await db.execute(
      `INSERT INTO patient_services (
        id, patient_id, service_id, quantity, unit_price, total_price,
        service_date, status, notes, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        serviceId, patient_id, service_id, quantity, unit_price, 
        total_price || (unit_price * quantity),
        service_date || new Date().toISOString().split('T')[0],
        status || 'Pending',
        notes || null,
        req.user.id
      ]
    );
    
    // Log activity
    await db.execute(
      `INSERT INTO activity_logs (id, user_id, action, details) 
       VALUES (?, ?, ?, ?)`,
      [uuidv4(), req.user.id, 'patient_service.created', 
       JSON.stringify({ service_id: serviceId, patient_id, service_id: service_id })]
    );
    
    res.status(201).json({ 
      message: 'Service assigned successfully',
      serviceId 
    });
  } catch (error) {
    console.error('Create patient service error:', error);
    res.status(500).json({ error: 'Failed to assign service' });
  }
};

// Update patient service (mark as completed, etc.)
exports.updatePatientService = async (req, res) => {
  try {
    const { status, notes, completed_by } = req.body;
    
    const updates = [];
    const values = [];
    
    if (status !== undefined) {
      updates.push('status = ?');
      values.push(status);
    }
    
    if (notes !== undefined) {
      updates.push('notes = ?');
      values.push(notes);
    }
    
    if (completed_by !== undefined) {
      updates.push('completed_by = ?');
      values.push(completed_by);
    }
    
    if (status === 'Completed') {
      updates.push('completed_at = NOW()');
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    values.push(req.params.id);
    
    await db.execute(
      `UPDATE patient_services SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    
    // Log activity
    await db.execute(
      `INSERT INTO activity_logs (id, user_id, action, details) 
       VALUES (?, ?, ?, ?)`,
      [uuidv4(), req.user.id, 'patient_service.updated', 
       JSON.stringify({ service_id: req.params.id, status })]
    );
    
    res.json({ message: 'Service updated successfully' });
  } catch (error) {
    console.error('Update patient service error:', error);
    res.status(500).json({ error: 'Failed to update service' });
  }
};

// Delete patient service
exports.deletePatientService = async (req, res) => {
  try {
    await db.execute('DELETE FROM patient_services WHERE id = ?', [req.params.id]);
    
    // Log activity
    await db.execute(
      `INSERT INTO activity_logs (id, user_id, action, details) 
       VALUES (?, ?, ?, ?)`,
      [uuidv4(), req.user.id, 'patient_service.deleted', 
       JSON.stringify({ service_id: req.params.id })]
    );
    
    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Delete patient service error:', error);
    res.status(500).json({ error: 'Failed to delete service' });
  }
};
