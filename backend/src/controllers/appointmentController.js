const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');

// Get all appointments
exports.getAllAppointments = async (req, res) => {
  try {
    const { date, doctor_id, patient_id, status, limit = 100, offset = 0 } = req.query;
    
    let query = `
      SELECT a.*, 
             DATE(a.appointment_date) as appointment_date_only,
             TIME_FORMAT(a.appointment_date, '%H:%i') as appointment_time,
             p.full_name as patient_name, p.phone as patient_phone,
             u.full_name as doctor_name,
             d.name as department_name, d.id as department_id
      FROM appointments a
      LEFT JOIN patients p ON a.patient_id = p.id
      LEFT JOIN users u ON a.doctor_id = u.id
      LEFT JOIN departments d ON a.department_id = d.id
      WHERE 1=1
    `;
    let params = [];
    
    if (date) {
      query += ' AND DATE(a.appointment_date) = ?';
      params.push(date);
    }
    
    if (doctor_id) {
      query += ' AND a.doctor_id = ?';
      params.push(doctor_id);
    }
    
    if (patient_id) {
      query += ' AND a.patient_id = ?';
      params.push(patient_id);
    }
    
    if (status) {
      query += ' AND a.status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY a.appointment_date DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const [appointments] = await db.execute(query, params);
    
    // Format the response to include both full datetime and separate date/time
    const formattedAppointments = appointments.map(appt => ({
      ...appt,
      appointment_date: appt.appointment_date_only || appt.appointment_date
    }));
    
    res.json({ appointments: formattedAppointments });
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
};

// Get single appointment
exports.getAppointment = async (req, res) => {
  try {
    const [appointments] = await db.execute(
      `SELECT a.*, 
              DATE(a.appointment_date) as appointment_date_only,
              TIME_FORMAT(a.appointment_date, '%H:%i') as appointment_time,
              p.full_name as patient_name, p.phone as patient_phone, p.email as patient_email,
              u.full_name as doctor_name
       FROM appointments a
       LEFT JOIN patients p ON a.patient_id = p.id
       LEFT JOIN users u ON a.doctor_id = u.id
       WHERE a.id = ?`,
      [req.params.id]
    );
    
    if (appointments.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    const appointment = {
      ...appointments[0],
      appointment_date: appointments[0].appointment_date_only || appointments[0].appointment_date
    };
    
    res.json({ appointment });
  } catch (error) {
    console.error('Get appointment error:', error);
    res.status(500).json({ error: 'Failed to fetch appointment' });
  }
};

// Create appointment
exports.createAppointment = async (req, res) => {
  try {
    console.log('Creating appointment with body:', req.body);
    
    const { 
      patient_id, doctor_id, department_id, appointment_date, appointment_time,
      appointment_type, reason, notes
    } = req.body;
    
    if (!patient_id || !doctor_id || !appointment_date) {
      console.log('Missing required fields:', { patient_id, doctor_id, appointment_date });
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const appointmentId = uuidv4();
    
    // Combine date and time into datetime
    let appointmentDateTime = appointment_date;
    if (appointment_time) {
      appointmentDateTime = `${appointment_date} ${appointment_time}`;
    }
    
    console.log('Inserting appointment with datetime:', appointmentDateTime);
    
    await db.execute(
      `INSERT INTO appointments (
        id, patient_id, doctor_id, department_id, appointment_date, type, reason, notes, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Scheduled')`,
      [appointmentId, patient_id, doctor_id, department_id || null, appointmentDateTime,
       appointment_type || 'Consultation', reason || null, notes || null]
    );
    
    console.log('Appointment created successfully:', appointmentId);
    
    // Log activity
    await db.execute(
      `INSERT INTO activity_logs (id, user_id, action, details) 
       VALUES (?, ?, ?, ?)`,
      [uuidv4(), req.user.id, 'appointment.created', 
       JSON.stringify({ appointment_id: appointmentId, patient_id, doctor_id, date: appointment_date })]
    );
    
    // Emit real-time update
    if (global.emitUpdate) {
      global.emitUpdate('appointments', 'appointment:created', { id: appointmentId });
    }
    
    res.status(201).json({ 
      message: 'Appointment created successfully',
      appointmentId 
    });
  } catch (error) {
    console.error('Create appointment error:', error);
    console.error('Error message:', error.message);
    console.error('SQL State:', error.sqlState);
    console.error('SQL Message:', error.sqlMessage);
    res.status(500).json({ 
      error: 'Failed to create appointment',
      details: error.message 
    });
  }
};

// Update appointment
exports.updateAppointment = async (req, res) => {
  try {
    const { 
      appointment_date, appointment_time, appointment_type,
      reason, notes, status
    } = req.body;
    
    // Combine date and time if both provided
    let appointmentDateTime = appointment_date;
    if (appointment_date && appointment_time) {
      appointmentDateTime = `${appointment_date} ${appointment_time}`;
    }
    
    await db.execute(
      `UPDATE appointments 
       SET appointment_date = ?, type = ?, reason = ?, notes = ?, status = ?
       WHERE id = ?`,
      [appointmentDateTime || appointment_date, appointment_type, reason, notes, status, req.params.id]
    );
    
    // Log activity
    await db.execute(
      `INSERT INTO activity_logs (id, user_id, action, details) 
       VALUES (?, ?, ?, ?)`,
      [uuidv4(), req.user.id, 'appointment.updated', 
       JSON.stringify({ appointment_id: req.params.id, status })]
    );
    
    // Emit real-time update
    if (global.emitUpdate) {
      global.emitUpdate('appointments', 'appointment:updated', { id: req.params.id, status });
    }
    
    res.json({ message: 'Appointment updated successfully' });
  } catch (error) {
    console.error('Update appointment error:', error);
    res.status(500).json({ error: 'Failed to update appointment' });
  }
};

// Delete appointment
exports.deleteAppointment = async (req, res) => {
  try {
    await db.execute('DELETE FROM appointments WHERE id = ?', [req.params.id]);
    
    // Log activity
    await db.execute(
      `INSERT INTO activity_logs (id, user_id, action, details) 
       VALUES (?, ?, ?, ?)`,
      [uuidv4(), req.user.id, 'appointment.deleted', JSON.stringify({ appointment_id: req.params.id })]
    );
    
    // Emit real-time update
    if (global.emitUpdate) {
      global.emitUpdate('appointments', 'appointment:deleted', { id: req.params.id });
    }
    
    res.json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    console.error('Delete appointment error:', error);
    res.status(500).json({ error: 'Failed to delete appointment' });
  }
};
