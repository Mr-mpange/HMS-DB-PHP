const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const settingsController = require('../controllers/settingsController');

router.use(authenticate);

// Get settings
router.get('/', settingsController.getAllSettings);
router.get('/:key', settingsController.getSetting);

// Update settings (admin only)
router.put('/:key', requireRole(['admin']), settingsController.updateSetting);
router.post('/', requireRole(['admin']), settingsController.createSetting);

module.exports = router;
