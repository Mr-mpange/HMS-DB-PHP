const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');

// Register new user
exports.register = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { email, password, full_name, phone, role = 'receptionist' } = req.body;
    
    // Validate input
    if (!email || !password || !full_name) {
      return res.status(400).json({ error: 'Email, password, and full name are required' });
    }
    
    // Check if user exists
    const [existing] = await connection.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    // Hash password
    const password_hash = await bcrypt.hash(password, 10);
    const userId = uuidv4();
    
    // Insert user
    await connection.execute(
      `INSERT INTO users (id, email, password_hash, full_name, phone, is_active, email_verified) 
       VALUES (?, ?, ?, ?, ?, TRUE, FALSE)`,
      [userId, email, password_hash, full_name, phone]
    );
    
    // Create profile
    await connection.execute(
      `INSERT INTO profiles (id, user_id, full_name, email, phone) 
       VALUES (?, ?, ?, ?, ?)`,
      [uuidv4(), userId, full_name, email, phone]
    );
    
    // Assign role
    await connection.execute(
      'INSERT INTO user_roles (user_id, role, is_primary) VALUES (?, ?, TRUE)',
      [userId, role]
    );
    
    // Log activity
    await connection.execute(
      `INSERT INTO activity_logs (id, user_id, action, details, ip_address) 
       VALUES (?, ?, ?, ?, ?)`,
      [uuidv4(), userId, 'user.registered', JSON.stringify({ email, role }), req.ip]
    );
    
    await connection.commit();
    
    res.status(201).json({ 
      message: 'User registered successfully',
      userId 
    });
  } catch (error) {
    await connection.rollback();
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  } finally {
    connection.release();
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Get user with roles
    const [users] = await db.execute(
      `SELECT u.*, GROUP_CONCAT(ur.role) as roles, 
              GROUP_CONCAT(CASE WHEN ur.is_primary THEN ur.role END) as primary_role
       FROM users u
       LEFT JOIN user_roles ur ON u.id = ur.user_id
       WHERE u.email = ? AND u.is_active = TRUE
       GROUP BY u.id`,
      [email]
    );
    
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = users[0];
    
    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Parse roles
    const roles = user.roles ? user.roles.split(',') : [];
    const primaryRole = user.primary_role || roles[0];
    
    // Generate JWT
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        roles 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
    
    // Create session
    const sessionId = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    await db.execute(
      `INSERT INTO sessions (id, user_id, token, expires_at, ip_address, user_agent) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [sessionId, user.id, token, expiresAt, req.ip, req.headers['user-agent']]
    );
    
    // Update last login
    await db.execute(
      'UPDATE users SET last_login = NOW() WHERE id = ?',
      [user.id]
    );
    
    // Log activity
    await db.execute(
      `INSERT INTO activity_logs (id, user_id, action, details, ip_address) 
       VALUES (?, ?, ?, ?, ?)`,
      [uuidv4(), user.id, 'user.login', JSON.stringify({ email, roles }), req.ip]
    );
    
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        phone: user.phone,
        roles,
        primaryRole
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

// Logout
exports.logout = async (req, res) => {
  try {
    // Delete session
    await db.execute(
      'DELETE FROM sessions WHERE token = ?',
      [req.token]
    );
    
    // Log activity
    await db.execute(
      `INSERT INTO activity_logs (id, user_id, action, details, ip_address) 
       VALUES (?, ?, ?, ?, ?)`,
      [uuidv4(), req.user.id, 'user.logout', JSON.stringify({ email: req.user.email }), req.ip]
    );
    
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
};

// Get current user
exports.getCurrentUser = async (req, res) => {
  try {
    const [users] = await db.execute(
      `SELECT u.id, u.email, u.full_name, u.phone, u.is_active, u.email_verified,
              GROUP_CONCAT(ur.role) as roles,
              GROUP_CONCAT(CASE WHEN ur.is_primary THEN ur.role END) as primary_role
       FROM users u
       LEFT JOIN user_roles ur ON u.id = ur.user_id
       WHERE u.id = ?
       GROUP BY u.id`,
      [req.user.id]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = users[0];
    user.roles = user.roles ? user.roles.split(',') : [];
    user.primaryRole = user.primary_role || user.roles[0];
    delete user.primary_role;
    
    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }
    
    // Get user
    const [users] = await db.execute(
      'SELECT password_hash FROM users WHERE id = ?',
      [req.user.id]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, users[0].password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    
    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    
    // Update password
    await db.execute(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [newPasswordHash, req.user.id]
    );
    
    // Invalidate all sessions except current
    await db.execute(
      'DELETE FROM sessions WHERE user_id = ? AND token != ?',
      [req.user.id, req.token]
    );
    
    // Log activity
    await db.execute(
      `INSERT INTO activity_logs (id, user_id, action, details, ip_address) 
       VALUES (?, ?, ?, ?, ?)`,
      [uuidv4(), req.user.id, 'user.password_changed', JSON.stringify({}), req.ip]
    );
    
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
};
