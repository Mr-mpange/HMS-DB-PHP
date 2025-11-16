const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const path = require('path');
const fs = require('fs').promises;

// Upload file
exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { entity_type, entity_id, description } = req.body;
    
    if (!entity_type || !entity_id) {
      return res.status(400).json({ error: 'Entity type and ID are required' });
    }

    const fileId = uuidv4();
    const file = req.file;
    
    // Store file metadata in database
    await db.execute(
      `INSERT INTO uploaded_files (
        id, entity_type, entity_id, file_name, original_name,
        file_path, file_size, mime_type, description, uploaded_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        fileId,
        entity_type,
        entity_id,
        file.filename,
        file.originalname,
        file.path,
        file.size,
        file.mimetype,
        description,
        req.user.id
      ]
    );

    // Log activity
    await db.execute(
      `INSERT INTO activity_logs (id, user_id, action, details) 
       VALUES (?, ?, ?, ?)`,
      [
        uuidv4(),
        req.user.id,
        'file.uploaded',
        JSON.stringify({
          file_id: fileId,
          entity_type,
          entity_id,
          file_name: file.originalname,
          file_size: file.size
        })
      ]
    );

    // Emit real-time update
    if (global.emitUpdate) {
      global.emitUpdate('files', 'file:uploaded', {
        id: fileId,
        entity_type,
        entity_id
      });
    }

    res.status(201).json({
      message: 'File uploaded successfully',
      fileId,
      file: {
        id: fileId,
        name: file.originalname,
        size: file.size,
        type: file.mimetype
      }
    });
  } catch (error) {
    console.error('Upload file error:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
};

// Get files by entity
exports.getFilesByEntity = async (req, res) => {
  try {
    const { entity_type, entity_id } = req.params;

    const [files] = await db.execute(
      `SELECT f.*, u.full_name as uploaded_by_name
       FROM uploaded_files f
       LEFT JOIN users u ON f.uploaded_by = u.id
       WHERE f.entity_type = ? AND f.entity_id = ?
       ORDER BY f.created_at DESC`,
      [entity_type, entity_id]
    );

    res.json({ files });
  } catch (error) {
    console.error('Get files error:', error);
    res.status(500).json({ error: 'Failed to fetch files' });
  }
};

// Get single file metadata
exports.getFile = async (req, res) => {
  try {
    const [files] = await db.execute(
      `SELECT f.*, u.full_name as uploaded_by_name
       FROM uploaded_files f
       LEFT JOIN users u ON f.uploaded_by = u.id
       WHERE f.id = ?`,
      [req.params.id]
    );

    if (files.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.json({ file: files[0] });
  } catch (error) {
    console.error('Get file error:', error);
    res.status(500).json({ error: 'Failed to fetch file' });
  }
};

// Download file
exports.downloadFile = async (req, res) => {
  try {
    const [files] = await db.execute(
      'SELECT * FROM uploaded_files WHERE id = ?',
      [req.params.id]
    );

    if (files.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }

    const file = files[0];

    // Check if file exists
    try {
      await fs.access(file.file_path);
    } catch (error) {
      return res.status(404).json({ error: 'File not found on disk' });
    }

    // Set headers for download
    res.setHeader('Content-Type', file.mime_type);
    res.setHeader('Content-Disposition', `attachment; filename="${file.original_name}"`);
    res.setHeader('Content-Length', file.file_size);

    // Stream file
    const fileStream = require('fs').createReadStream(file.file_path);
    fileStream.pipe(res);

    // Log activity
    await db.execute(
      `INSERT INTO activity_logs (id, user_id, action, details) 
       VALUES (?, ?, ?, ?)`,
      [
        uuidv4(),
        req.user.id,
        'file.downloaded',
        JSON.stringify({
          file_id: file.id,
          file_name: file.original_name
        })
      ]
    );
  } catch (error) {
    console.error('Download file error:', error);
    res.status(500).json({ error: 'Failed to download file' });
  }
};

// Delete file
exports.deleteFile = async (req, res) => {
  try {
    const [files] = await db.execute(
      'SELECT * FROM uploaded_files WHERE id = ?',
      [req.params.id]
    );

    if (files.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }

    const file = files[0];

    // Delete file from disk
    try {
      await fs.unlink(file.file_path);
    } catch (error) {
      console.warn('File not found on disk:', error);
    }

    // Delete from database
    await db.execute('DELETE FROM uploaded_files WHERE id = ?', [req.params.id]);

    // Log activity
    await db.execute(
      `INSERT INTO activity_logs (id, user_id, action, details) 
       VALUES (?, ?, ?, ?)`,
      [
        uuidv4(),
        req.user.id,
        'file.deleted',
        JSON.stringify({
          file_id: file.id,
          file_name: file.original_name
        })
      ]
    );

    // Emit real-time update
    if (global.emitUpdate) {
      global.emitUpdate('files', 'file:deleted', {
        id: req.params.id,
        entity_type: file.entity_type,
        entity_id: file.entity_id
      });
    }

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
};

// Get all files (admin)
exports.getAllFiles = async (req, res) => {
  try {
    const { entity_type, limit = 100, offset = 0 } = req.query;

    let query = `
      SELECT f.*, u.full_name as uploaded_by_name
      FROM uploaded_files f
      LEFT JOIN users u ON f.uploaded_by = u.id
      WHERE 1=1
    `;
    let params = [];

    if (entity_type) {
      query += ' AND f.entity_type = ?';
      params.push(entity_type);
    }

    query += ' ORDER BY f.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [files] = await db.execute(query, params);

    res.json({ files });
  } catch (error) {
    console.error('Get all files error:', error);
    res.status(500).json({ error: 'Failed to fetch files' });
  }
};
