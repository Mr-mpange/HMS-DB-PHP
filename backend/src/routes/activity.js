const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const db = require('../config/database');

// Get activity logs (admin only)
router.get('/', authenticate, requireRole(['admin']), async (req, res) => {
  try {
    const { limit = 100, offset = 0 } = req.query;
    
    const [logs] = await db.execute(
      `SELECT al.*, u.email, u.full_name 
       FROM activity_logs al
       LEFT JOIN users u ON al.user_id = u.id
       ORDER BY al.created_at DESC
       LIMIT ? OFFSET ?`,
      [parseInt(limit), parseInt(offset)]
    );
    
    res.json({ logs });
  } catch (error) {
    console.error('Get activity logs error:', error);
    res.status(500).json({ error: 'Failed to fetch activity logs' });
  }
});

// Create activity log (any authenticated user)
router.post('/', authenticate, async (req, res) => {
  try {
    const { action, details, ip_address } = req.body;
    
    if (!action) {
      return res.status(400).json({ error: 'Action is required' });
    }
    
    const { v4: uuidv4 } = require('uuid');
    const logId = uuidv4();
    
    await db.execute(
      `INSERT INTO activity_logs (id, user_id, action, details, ip_address) 
       VALUES (?, ?, ?, ?, ?)`,
      [logId, req.user.id, action, details || null, ip_address || req.ip]
    );
    
    res.status(201).json({ 
      message: 'Activity logged',
      logId 
    });
  } catch (error) {
    console.error('Create activity log error:', error);
    res.status(500).json({ error: 'Failed to log activity' });
  }
});

module.exports = router;
