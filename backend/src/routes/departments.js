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

module.exports = router;
