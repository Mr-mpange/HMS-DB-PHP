const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const insuranceController = require('../controllers/insuranceController');

router.use(authenticate);

// Insurance companies
router.get('/companies', insuranceController.getAllCompanies);
router.get('/companies/:id', insuranceController.getCompany);
router.post('/companies', requireRole(['admin']), insuranceController.createCompany);
router.put('/companies/:id', requireRole(['admin']), insuranceController.updateCompany);

// Insurance claims
router.get('/claims', insuranceController.getAllClaims);
router.get('/claims/:id', insuranceController.getClaim);
router.post('/claims', requireRole(['billing', 'admin']), insuranceController.createClaim);
router.put('/claims/:id', requireRole(['billing', 'admin']), insuranceController.updateClaim);

module.exports = router;
