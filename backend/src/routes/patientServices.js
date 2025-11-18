const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const patientServicesController = require('../controllers/patientServicesController');

router.use(authenticate);

router.get('/', patientServicesController.getAllPatientServices);
router.get('/patient/:patientId', patientServicesController.getPatientServices);
router.get('/pending', requireRole(['nurse', 'doctor', 'admin']), patientServicesController.getPendingServices);
router.post('/', requireRole(['receptionist', 'doctor', 'nurse', 'admin']), patientServicesController.createPatientService);
router.put('/:id', requireRole(['nurse', 'doctor', 'admin']), patientServicesController.updatePatientService);
router.delete('/:id', requireRole(['admin', 'receptionist']), patientServicesController.deletePatientService);

module.exports = router;
