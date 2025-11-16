const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');

// Get all departments
exports.getAllDepartments = async (req, res) => {
  try {
    const [departments] = await db.execute(
      'SELECT * FROM departments ORDER BY name'
    );
    
    res.json({ departments });
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
};

// Get single department
exports.getDepartment = async (req, res) => {
  try {
    const [departments] = await db.execute(
      'SELECT * FROM departments WHERE id = ?',
      [req.params.id]
    );
    
    if (departments.length === 0) {
      return res.status(404).json({ error: 'Department not found' });
    }
    
    res.json({ department: departments[0] });
  } catch (error) {
    console.error('Get department error:', error);
    res.status(500).json({ error: 'Failed to fetch department' });
  }
};

// Create department
exports.createDepartment = async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Department name is required' });
    }
    
    const departmentId = uuidv4();
    
    await db.execute(
      'INSERT INTO departments (id, name, description) VALUES (?, ?, ?)',
      [departmentId, name, description || null]
    );
    
    // Log activity
    await db.execute(
      `INSERT INTO activity_logs (id, user_id, action, details) 
       VALUES (?, ?, ?, ?)`,
      [uuidv4(), req.user.id, 'department.created', 
       JSON.stringify({ department_id: departmentId, name })]
    );
    
    res.status(201).json({ 
      message: 'Department created successfully',
      departmentId 
    });
  } catch (error) {
    console.error('Create department error:', error);
    res.status(500).json({ error: 'Failed to create department' });
  }
};

// Update department
exports.updateDepartment = async (req, res) => {
  try {
    const { name, description } = req.body;
    
    await db.execute(
      'UPDATE departments SET name = ?, description = ? WHERE id = ?',
      [name, description, req.params.id]
    );
    
    // Log activity
    await db.execute(
      `INSERT INTO activity_logs (id, user_id, action, details) 
       VALUES (?, ?, ?, ?)`,
      [uuidv4(), req.user.id, 'department.updated', 
       JSON.stringify({ department_id: req.params.id })]
    );
    
    res.json({ message: 'Department updated successfully' });
  } catch (error) {
    console.error('Update department error:', error);
    res.status(500).json({ error: 'Failed to update department' });
  }
};

// Delete department
exports.deleteDepartment = async (req, res) => {
  try {
    await db.execute('DELETE FROM departments WHERE id = ?', [req.params.id]);
    
    // Log activity
    await db.execute(
      `INSERT INTO activity_logs (id, user_id, action, details) 
       VALUES (?, ?, ?, ?)`,
      [uuidv4(), req.user.id, 'department.deleted', 
       JSON.stringify({ department_id: req.params.id })]
    );
    
    res.json({ message: 'Department deleted successfully' });
  } catch (error) {
    console.error('Delete department error:', error);
    res.status(500).json({ error: 'Failed to delete department' });
  }
};

// Get doctors by department
exports.getDepartmentDoctors = async (req, res) => {
  try {
    const [doctors] = await db.execute(
      `SELECT u.id, u.email, u.full_name, p.phone, p.avatar_url, dd.id as assignment_id
       FROM users u
       INNER JOIN user_roles ur ON u.id = ur.user_id
       LEFT JOIN profiles p ON u.id = p.user_id
       LEFT JOIN department_doctors dd ON u.id = dd.doctor_id AND dd.department_id = ?
       WHERE ur.role = 'doctor' AND u.is_active = TRUE
       ORDER BY u.full_name`,
      [req.params.id]
    );
    
    res.json({ doctors });
  } catch (error) {
    console.error('Get department doctors error:', error);
    res.status(500).json({ error: 'Failed to fetch department doctors' });
  }
};

// Assign doctor to department
exports.assignDoctor = async (req, res) => {
  try {
    const { doctor_id } = req.body;
    const department_id = req.params.id;
    
    if (!doctor_id) {
      return res.status(400).json({ error: 'Doctor ID is required' });
    }
    
    // Check if already assigned
    const [existing] = await db.execute(
      'SELECT id FROM department_doctors WHERE department_id = ? AND doctor_id = ?',
      [department_id, doctor_id]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Doctor already assigned to this department' });
    }
    
    const assignmentId = uuidv4();
    await db.execute(
      'INSERT INTO department_doctors (id, department_id, doctor_id) VALUES (?, ?, ?)',
      [assignmentId, department_id, doctor_id]
    );
    
    // Log activity
    await db.execute(
      `INSERT INTO activity_logs (id, user_id, action, details) 
       VALUES (?, ?, ?, ?)`,
      [uuidv4(), req.user.id, 'department.doctor_assigned', 
       JSON.stringify({ department_id, doctor_id })]
    );
    
    res.json({ message: 'Doctor assigned successfully', assignmentId });
  } catch (error) {
    console.error('Assign doctor error:', error);
    res.status(500).json({ error: 'Failed to assign doctor' });
  }
};

// Remove doctor from department
exports.removeDoctor = async (req, res) => {
  try {
    const { doctor_id } = req.body;
    const department_id = req.params.id;
    
    await db.execute(
      'DELETE FROM department_doctors WHERE department_id = ? AND doctor_id = ?',
      [department_id, doctor_id]
    );
    
    // Log activity
    await db.execute(
      `INSERT INTO activity_logs (id, user_id, action, details) 
       VALUES (?, ?, ?, ?)`,
      [uuidv4(), req.user.id, 'department.doctor_removed', 
       JSON.stringify({ department_id, doctor_id })]
    );
    
    res.json({ message: 'Doctor removed successfully' });
  } catch (error) {
    console.error('Remove doctor error:', error);
    res.status(500).json({ error: 'Failed to remove doctor' });
  }
};
