const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const departmentController = require('../controllers/departmentController');

router.use(authenticate);

router.get('/', departmentController.getAllDepartments);
router.get('/:id', departmentController.getDepartment);
router.post('/', requireRole(['admin']), departmentController.createDepartment);
router.put('/:id', requireRole(['admin']), departmentController.updateDepartment);
router.delete('/:id', requireRole(['admin']), departmentController.deleteDepartment);

// Doctor assignment routes
router.get('/:id/doctors', departmentController.getDepartmentDoctors);
router.post('/:id/doctors', requireRole(['admin']), departmentController.assignDoctor);
router.delete('/:id/doctors', requireRole(['admin']), departmentController.removeDoctor);

module.exports = router;
