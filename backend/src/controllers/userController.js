const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const db = require('../config/database');

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const { role, search, limit = 100, offset = 0 } = req.query;
    
    let query = `
      SELECT u.id, u.email, u.full_name, u.phone, u.is_active, u.email_verified, u.last_login,
             GROUP_CONCAT(ur.role) as roles,
             GROUP_CONCAT(CASE WHEN ur.is_primary THEN ur.role END) as primary_role
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      WHERE 1=1
    `;
    let params = [];
    
    if (search) {
      query += ' AND (u.full_name LIKE ? OR u.email LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }
    
    query += ' GROUP BY u.id';
    
    if (role) {
      query += ' HAVING FIND_IN_SET(?, roles) > 0';
      params.push(role);
    }
    
    query += ' ORDER BY u.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const [users] = await db.execute(query, params);
    
    // Parse roles
    const usersWithRoles = users.map(user => ({
      ...user,
      roles: user.roles ? user.roles.split(',') : [],
      primaryRole: user.primary_role || (user.roles ? user.roles.split(',')[0] : null)
    }));
    
    res.json({ users: usersWithRoles });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// Get single user
exports.getUser = async (req, res) => {
  try {
    const [users] = await db.execute(
      `SELECT u.id, u.email, u.full_name, u.phone, u.is_active, u.email_verified, u.last_login, u.created_at,
              GROUP_CONCAT(ur.role) as roles,
              GROUP_CONCAT(CASE WHEN ur.is_primary THEN ur.role END) as primary_role
       FROM users u
       LEFT JOIN user_roles ur ON u.id = ur.user_id
       WHERE u.id = ?
       GROUP BY u.id`,
      [req.params.id]
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
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

// Create user
exports.createUser = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { email, password, full_name, phone, roles, is_active = true } = req.body;
    
    if (!email || !password || !full_name) {
      await connection.rollback();
      return res.status(400).json({ error: 'Email, password, and full name are required' });
    }
    
    // Check if user exists
    const [existing] = await connection.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );
    
    if (existing.length > 0) {
      await connection.rollback();
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    // Hash password
    const password_hash = await bcrypt.hash(password, 10);
    const userId = uuidv4();
    
    // Create user
    await connection.execute(
      `INSERT INTO users (id, email, password_hash, full_name, phone, is_active, email_verified) 
       VALUES (?, ?, ?, ?, ?, ?, FALSE)`,
      [userId, email, password_hash, full_name, phone, is_active]
    );
    
    // Create profile
    await connection.execute(
      `INSERT INTO profiles (id, user_id, full_name, email, phone) 
       VALUES (?, ?, ?, ?, ?)`,
      [uuidv4(), userId, full_name, email, phone]
    );
    
    // Assign roles
    if (roles && roles.length > 0) {
      for (let i = 0; i < roles.length; i++) {
        await connection.execute(
          'INSERT INTO user_roles (user_id, role, is_primary) VALUES (?, ?, ?)',
          [userId, roles[i], i === 0] // First role is primary
        );
      }
    }
    
    // Log activity
    await connection.execute(
      `INSERT INTO activity_logs (id, user_id, action, details) 
       VALUES (?, ?, ?, ?)`,
      [uuidv4(), req.user.id, 'user.created', 
       JSON.stringify({ new_user_id: userId, email, roles })]
    );
    
    await connection.commit();
    
    // Emit real-time update
    if (global.emitUpdate) {
      global.emitUpdate('users', 'user:created', { id: userId, email });
    }
    
    res.status(201).json({ 
      message: 'User created successfully',
      userId 
    });
  } catch (error) {
    await connection.rollback();
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  } finally {
    connection.release();
  }
};

// Update user
exports.updateUser = async (req, res) => {
  try {
    const { full_name, phone, is_active, email_verified } = req.body;
    
    await db.execute(
      `UPDATE users 
       SET full_name = ?, phone = ?, is_active = ?, email_verified = ?
       WHERE id = ?`,
      [full_name, phone, is_active, email_verified, req.params.id]
    );
    
    // Update profile
    await db.execute(
      `UPDATE profiles 
       SET full_name = ?, phone = ?
       WHERE user_id = ?`,
      [full_name, phone, req.params.id]
    );
    
    // Log activity
    await db.execute(
      `INSERT INTO activity_logs (id, user_id, action, details) 
       VALUES (?, ?, ?, ?)`,
      [uuidv4(), req.user.id, 'user.updated', 
       JSON.stringify({ updated_user_id: req.params.id })]
    );
    
    // Emit real-time update
    if (global.emitUpdate) {
      global.emitUpdate('users', 'user:updated', { id: req.params.id });
    }
    
    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    // Prevent deleting self
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    
    await db.execute('DELETE FROM users WHERE id = ?', [req.params.id]);
    
    // Log activity
    await db.execute(
      `INSERT INTO activity_logs (id, user_id, action, details) 
       VALUES (?, ?, ?, ?)`,
      [uuidv4(), req.user.id, 'user.deleted', 
       JSON.stringify({ deleted_user_id: req.params.id })]
    );
    
    // Emit real-time update
    if (global.emitUpdate) {
      global.emitUpdate('users', 'user:deleted', { id: req.params.id });
    }
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

// Assign role to user
exports.assignRole = async (req, res) => {
  try {
    const { role, is_primary = false } = req.body;
    
    if (!role) {
      return res.status(400).json({ error: 'Role is required' });
    }
    
    // Check if role already exists
    const [existing] = await db.execute(
      'SELECT id FROM user_roles WHERE user_id = ? AND role = ?',
      [req.params.id, role]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({ error: 'User already has this role' });
    }
    
    // If setting as primary, unset other primary roles
    if (is_primary) {
      await db.execute(
        'UPDATE user_roles SET is_primary = FALSE WHERE user_id = ?',
        [req.params.id]
      );
    }
    
    // Assign role
    await db.execute(
      'INSERT INTO user_roles (user_id, role, is_primary) VALUES (?, ?, ?)',
      [req.params.id, role, is_primary]
    );
    
    // Log activity
    await db.execute(
      `INSERT INTO activity_logs (id, user_id, action, details) 
       VALUES (?, ?, ?, ?)`,
      [uuidv4(), req.user.id, 'user.role.assigned', 
       JSON.stringify({ user_id: req.params.id, role, is_primary })]
    );
    
    // Emit real-time update
    if (global.emitUpdate) {
      global.emitUpdate('users', 'user:role_assigned', { 
        id: req.params.id,
        role
      });
    }
    
    res.json({ message: 'Role assigned successfully' });
  } catch (error) {
    console.error('Assign role error:', error);
    res.status(500).json({ error: 'Failed to assign role' });
  }
};

// Remove role from user
exports.removeRole = async (req, res) => {
  try {
    const { role } = req.body;
    
    if (!role) {
      return res.status(400).json({ error: 'Role is required' });
    }
    
    await db.execute(
      'DELETE FROM user_roles WHERE user_id = ? AND role = ?',
      [req.params.id, role]
    );
    
    // Log activity
    await db.execute(
      `INSERT INTO activity_logs (id, user_id, action, details) 
       VALUES (?, ?, ?, ?)`,
      [uuidv4(), req.user.id, 'user.role.removed', 
       JSON.stringify({ user_id: req.params.id, role })]
    );
    
    // Emit real-time update
    if (global.emitUpdate) {
      global.emitUpdate('users', 'user:role_removed', { 
        id: req.params.id,
        role
      });
    }
    
    res.json({ message: 'Role removed successfully' });
  } catch (error) {
    console.error('Remove role error:', error);
    res.status(500).json({ error: 'Failed to remove role' });
  }
};

// Reset user password (admin only)
exports.resetPassword = async (req, res) => {
  try {
    const { new_password } = req.body;
    
    if (!new_password) {
      return res.status(400).json({ error: 'New password is required' });
    }
    
    // Hash new password
    const password_hash = await bcrypt.hash(new_password, 10);
    
    await db.execute(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [password_hash, req.params.id]
    );
    
    // Invalidate all sessions for this user
    await db.execute(
      'DELETE FROM sessions WHERE user_id = ?',
      [req.params.id]
    );
    
    // Log activity
    await db.execute(
      `INSERT INTO activity_logs (id, user_id, action, details) 
       VALUES (?, ?, ?, ?)`,
      [uuidv4(), req.user.id, 'user.password.reset', 
       JSON.stringify({ user_id: req.params.id })]
    );
    
    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
};

// Get user profiles (for doctors list)
exports.getProfiles = async (req, res) => {
  try {
    const { role, search, limit = 100, offset = 0 } = req.query;
    
    let query = `
      SELECT DISTINCT 
        u.id as user_id,
        p.id as profile_id,
        p.full_name,
        p.phone,
        p.avatar_url,
        u.email,
        ur.role
      FROM users u
      INNER JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN profiles p ON u.id = p.user_id
      WHERE u.is_active = TRUE
    `;
    let params = [];
    
    if (role) {
      query += ' AND ur.role = ?';
      params.push(role);
    }
    
    if (search) {
      query += ' AND (p.full_name LIKE ? OR u.email LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }
    
    query += ' ORDER BY p.full_name ASC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const [profiles] = await db.execute(query, params);
    
    // Transform to ensure user_id is the actual user ID
    const transformedProfiles = profiles.map(p => ({
      id: p.user_id, // Use user ID as the main ID
      user_id: p.user_id,
      profile_id: p.profile_id,
      full_name: p.full_name,
      phone: p.phone,
      avatar_url: p.avatar_url,
      email: p.email,
      role: p.role
    }));
    
    res.json({ profiles: transformedProfiles });
  } catch (error) {
    console.error('Get profiles error:', error);
    res.status(500).json({ error: 'Failed to fetch profiles' });
  }
};

// Get user roles
exports.getUserRoles = async (req, res) => {
  try {
    const [roles] = await db.execute(
      'SELECT role, is_primary FROM user_roles WHERE user_id = ?',
      [req.params.id]
    );
    
    res.json({ roles });
  } catch (error) {
    console.error('Get user roles error:', error);
    res.status(500).json({ error: 'Failed to fetch user roles' });
  }
};
