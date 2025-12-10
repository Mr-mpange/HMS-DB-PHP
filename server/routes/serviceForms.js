const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// POST /api/service-forms - Save a completed service form
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { visit_id, patient_id, service_id, form_data, completed_by } = req.body;

    // Validate required fields
    if (!visit_id || !patient_id || !form_data || !completed_by) {
      return res.status(400).json({ 
        error: 'Missing required fields: visit_id, patient_id, form_data, completed_by' 
      });
    }

    // Insert form data
    const [result] = await db.query(
      `INSERT INTO service_forms 
       (visit_id, patient_id, service_id, form_data, completed_by) 
       VALUES (?, ?, ?, ?, ?)`,
      [visit_id, patient_id, service_id || null, JSON.stringify(form_data), completed_by]
    );

    console.log('Service form saved:', {
      formId: result.insertId,
      visit_id,
      patient_id,
      completed_by
    });

    res.json({ 
      success: true, 
      formId: result.insertId,
      message: 'Service form saved successfully'
    });
  } catch (error) {
    console.error('Error saving service form:', error);
    res.status(500).json({ 
      error: 'Failed to save service form',
      details: error.message 
    });
  }
});

// GET /api/service-forms/:visitId - Get forms for a specific visit
router.get('/:visitId', authenticateToken, async (req, res) => {
  try {
    const { visitId } = req.params;

    const [forms] = await db.query(
      `SELECT sf.*, u.full_name as completed_by_name
       FROM service_forms sf
       LEFT JOIN users u ON sf.completed_by = u.id
       WHERE sf.visit_id = ?
       ORDER BY sf.completed_at DESC`,
      [visitId]
    );

    // Parse JSON form_data
    const parsedForms = forms.map(form => ({
      ...form,
      form_data: typeof form.form_data === 'string' 
        ? JSON.parse(form.form_data) 
        : form.form_data
    }));

    res.json({ 
      success: true,
      forms: parsedForms 
    });
  } catch (error) {
    console.error('Error fetching service forms:', error);
    res.status(500).json({ 
      error: 'Failed to fetch service forms',
      details: error.message 
    });
  }
});

// GET /api/service-forms/patient/:patientId - Get all forms for a patient
router.get('/patient/:patientId', authenticateToken, async (req, res) => {
  try {
    const { patientId } = req.params;

    const [forms] = await db.query(
      `SELECT sf.*, 
              u.full_name as completed_by_name, 
              v.visit_date,
              p.full_name as patient_name
       FROM service_forms sf
       LEFT JOIN users u ON sf.completed_by = u.id
       LEFT JOIN visits v ON sf.visit_id = v.id
       LEFT JOIN patients p ON sf.patient_id = p.id
       WHERE sf.patient_id = ?
       ORDER BY sf.completed_at DESC`,
      [patientId]
    );

    // Parse JSON form_data
    const parsedForms = forms.map(form => ({
      ...form,
      form_data: typeof form.form_data === 'string' 
        ? JSON.parse(form.form_data) 
        : form.form_data
    }));

    res.json({ 
      success: true,
      forms: parsedForms 
    });
  } catch (error) {
    console.error('Error fetching patient forms:', error);
    res.status(500).json({ 
      error: 'Failed to fetch patient forms',
      details: error.message 
    });
  }
});

// GET /api/service-forms - Get all forms (with optional filters)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const [forms] = await db.query(
      `SELECT sf.*, 
              u.full_name as completed_by_name, 
              v.visit_date,
              p.full_name as patient_name
       FROM service_forms sf
       LEFT JOIN users u ON sf.completed_by = u.id
       LEFT JOIN visits v ON sf.visit_id = v.id
       LEFT JOIN patients p ON sf.patient_id = p.id
       ORDER BY sf.completed_at DESC
       LIMIT ? OFFSET ?`,
      [parseInt(limit), parseInt(offset)]
    );

    // Parse JSON form_data
    const parsedForms = forms.map(form => ({
      ...form,
      form_data: typeof form.form_data === 'string' 
        ? JSON.parse(form.form_data) 
        : form.form_data
    }));

    res.json({ 
      success: true,
      forms: parsedForms,
      count: parsedForms.length
    });
  } catch (error) {
    console.error('Error fetching service forms:', error);
    res.status(500).json({ 
      error: 'Failed to fetch service forms',
      details: error.message 
    });
  }
});

module.exports = router;
