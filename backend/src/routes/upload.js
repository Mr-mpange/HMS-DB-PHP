const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/upload');
const uploadController = require('../controllers/uploadController');

// All routes require authentication
router.use(authenticate);

// Upload file
router.post(
  '/',
  upload.single('file'),
  handleUploadError,
  uploadController.uploadFile
);

// Get files by entity
router.get('/entity/:entity_type/:entity_id', uploadController.getFilesByEntity);

// Get single file metadata
router.get('/:id', uploadController.getFile);

// Download file
router.get('/:id/download', uploadController.downloadFile);

// Delete file
router.delete('/:id', uploadController.deleteFile);

// Get all files (admin only)
router.get('/', requireRole(['admin']), uploadController.getAllFiles);

module.exports = router;
