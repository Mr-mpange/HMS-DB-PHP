const jwt = require('jsonwebtoken');
const db = require('../config/database');

// Authenticate JWT token
exports.authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if session exists and is valid
    const [sessions] = await db.execute(
      'SELECT * FROM sessions WHERE token = ? AND expires_at > NOW()',
      [token]
    );
    
    if (sessions.length === 0) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    
    // Get user with roles
    const [users] = await db.execute(
      `SELECT u.*, GROUP_CONCAT(ur.role) as roles
       FROM users u
       LEFT JOIN user_roles ur ON u.id = ur.user_id
       WHERE u.id = ? AND u.is_active = TRUE
       GROUP BY u.id`,
      [decoded.userId]
    );
    
    if (users.length === 0) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }
    
    const user = users[0];
    user.roles = user.roles ? user.roles.split(',') : [];
    
    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

// Check if user has required role
exports.requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const hasRole = roles.some(role => req.user.roles.includes(role));
    
    if (!hasRole) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: roles,
        current: req.user.roles
      });
    }
    
    next();
  };
};

// Optional authentication (doesn't fail if no token)
exports.optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const [users] = await db.execute(
      `SELECT u.*, GROUP_CONCAT(ur.role) as roles
       FROM users u
       LEFT JOIN user_roles ur ON u.id = ur.user_id
       WHERE u.id = ? AND u.is_active = TRUE
       GROUP BY u.id`,
      [decoded.userId]
    );
    
    if (users.length > 0) {
      const user = users[0];
      user.roles = user.roles ? user.roles.split(',') : [];
      req.user = user;
    }
    
    next();
  } catch (error) {
    next();
  }
};
