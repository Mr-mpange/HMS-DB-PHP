const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const pharmacyController = require('../controllers/pharmacyController');

router.use(authenticate);

// Medications
router.get('/medications', pharmacyController.getAllMedications);
router.get('/medications/low-stock', pharmacyController.getLowStock);
router.get('/medications/:id', pharmacyController.getMedication);
router.post('/medications', requireRole(['admin', 'pharmacist']), pharmacyController.createMedication);
router.put('/medications/:id', requireRole(['admin', 'pharmacist']), pharmacyController.updateMedication);
router.put('/medications/:id/stock', requireRole(['admin', 'pharmacist']), pharmacyController.updateStock);

// Dispensing
router.post('/dispense/:id', requireRole(['pharmacist']), pharmacyController.dispensePrescription);

module.exports = router;
