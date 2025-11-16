const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const billingController = require('../controllers/billingController');

router.use(authenticate);

// Invoices
router.get('/invoices', billingController.getAllInvoices);
router.get('/invoices/:id', billingController.getInvoice);
router.post('/invoices', requireRole(['admin', 'billing', 'receptionist', 'pharmacist']), billingController.createInvoice);
router.put('/invoices/:id', requireRole(['admin', 'billing']), billingController.updateInvoice);

// Invoice Items
router.post('/invoice-items', requireRole(['admin', 'billing', 'receptionist', 'pharmacist']), billingController.createInvoiceItem);

// Payments
router.get('/payments', billingController.getPayments);
router.post('/payments', requireRole(['admin', 'billing']), billingController.recordPayment);

module.exports = router;
