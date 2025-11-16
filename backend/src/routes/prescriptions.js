const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const prescriptionController = require('../controllers/prescriptionController');

router.use(authenticate);

router.get('/', prescriptionController.getAllPrescriptions);
router.post('/', requireRole(['doctor']), prescriptionController.createPrescription);
router.put('/:id', requireRole(['pharmacist', 'doctor']), prescriptionController.updatePrescription);

module.exports = router;
