const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const appointmentController = require('../controllers/appointmentController');

router.use(authenticate);

router.get('/', appointmentController.getAllAppointments);
router.get('/:id', appointmentController.getAppointment);
router.post('/', requireRole(['admin', 'receptionist', 'doctor']), appointmentController.createAppointment);
router.put('/:id', requireRole(['admin', 'receptionist', 'doctor']), appointmentController.updateAppointment);
router.delete('/:id', requireRole(['admin', 'receptionist']), appointmentController.deleteAppointment);

module.exports = router;
