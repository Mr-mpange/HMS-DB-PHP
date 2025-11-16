const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const patientController = require('../controllers/patientController');

// All routes require authentication
router.use(authenticate);

// Get all patients
router.get('/', patientController.getAllPatients);

// Get single patient
router.get('/:id', patientController.getPatient);

// Create patient (requires specific roles)
router.post('/', 
  requireRole(['admin', 'receptionist', 'doctor', 'nurse']), 
  patientController.createPatient
);

// Update patient
router.put('/:id', 
  requireRole(['admin', 'receptionist', 'doctor', 'nurse']), 
  patientController.updatePatient
);

// Delete patient (admin only)
router.delete('/:id', 
  requireRole(['admin']), 
  patientController.deletePatient
);

module.exports = router;
