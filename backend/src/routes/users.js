const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const userController = require('../controllers/userController');

// All routes require authentication and admin role
router.use(authenticate);

// Public endpoints (no admin required)
router.get('/profiles', userController.getProfiles);
router.get('/:id/roles', userController.getUserRoles);

// Admin only endpoints
router.use(requireRole(['admin']));

router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUser);
router.post('/', userController.createUser);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);
router.post('/:id/roles', userController.assignRole);
router.delete('/:id/roles', userController.removeRole);
router.post('/:id/reset-password', userController.resetPassword);

module.exports = router;
