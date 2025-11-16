const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const paymentController = require('../controllers/paymentController');

router.use(authenticate);

router.get('/', paymentController.getAllPayments);
router.get('/:id', paymentController.getPayment);
router.post('/', requireRole(['admin', 'receptionist', 'billing']), paymentController.createPayment);
router.put('/:id', requireRole(['admin', 'billing']), paymentController.updatePayment);
router.delete('/:id', requireRole(['admin']), paymentController.deletePayment);

module.exports = router;
