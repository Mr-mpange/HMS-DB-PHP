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

module.exports = router;
