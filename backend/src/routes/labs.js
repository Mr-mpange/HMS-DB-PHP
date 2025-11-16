const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const labController = require('../controllers/labController');

router.use(authenticate);

router.get('/', labController.getAllLabTests);
router.get('/:id', labController.getLabTest);
router.post('/', requireRole(['doctor']), labController.createLabTest);
router.put('/:id', requireRole(['lab_tech', 'doctor']), labController.updateLabTest);
router.post('/:id/results', requireRole(['lab_tech']), labController.addLabResults);
router.get('/:id/results', labController.getLabResults);
router.post('/results/batch', requireRole(['lab_tech']), labController.addBatchLabResults);

module.exports = router;
