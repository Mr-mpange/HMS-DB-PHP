const express = require('express');
const router = express.Router();
const servicesController = require('../controllers/servicesController');
const { authenticate, requireRole } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Bulk import services (must be before /:id routes)
router.post('/bulk', servicesController.bulkImportServices);

// Get all services
router.get('/', servicesController.getAllServices);

// Get service by ID
router.get('/:id', servicesController.getServiceById);

// Create new service
router.post('/', servicesController.createService);

// Update service
router.put('/:id', servicesController.updateService);

// Delete service
router.delete('/:id', servicesController.deleteService);

module.exports = router;
