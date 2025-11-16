const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkUserRoles() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'hospital_db'
  });

  try {
    console.log('✅ Connected to database\n');
    
    // Check users and their roles
    const [users] = await connection.execute(`
      SELECT u.id, u.email, u.full_name, p.role
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      ORDER BY p.role, u.full_name
    `);
    
    console.log('=== USERS AND ROLES ===\n');
    
    const roleGroups = {};
    users.forEach(user => {
      const role = user.role || 'No Role';
      if (!roleGroups[role]) {
        roleGroups[role] = [];
      }
      roleGroups[role].push(user);
    });
    
    Object.keys(roleGroups).sort().forEach(role => {
      console.log(`${role.toUpperCase()}:`);
      roleGroups[role].forEach(user => {
        console.log(`  - ${user.full_name} (${user.email})`);
      });
      console.log('');
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkUserRoles();
