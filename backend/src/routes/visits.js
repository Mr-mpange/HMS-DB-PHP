const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const visitController = require('../controllers/visitController');

router.use(authenticate);

router.get('/', visitController.getAllVisits);
router.get('/:id', visitController.getVisit);
router.post('/', requireRole(['admin', 'receptionist', 'nurse', 'doctor']), visitController.createVisit);
router.put('/:id', requireRole(['admin', 'receptionist', 'nurse', 'doctor', 'lab', 'lab_tech', 'pharmacist', 'billing']), visitController.updateVisit);
router.delete('/:id', requireRole(['admin']), visitController.deleteVisit);

module.exports = router;
