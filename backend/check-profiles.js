const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkProfiles() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'hospital_db'
  });

  try {
    console.log('✅ Connected to database\n');
    
    // Check profiles table structure
    const [cols] = await connection.execute('DESCRIBE profiles');
    console.log('=== PROFILES TABLE STRUCTURE ===');
    cols.forEach(col => {
      console.log(`${col.Field}: ${col.Type}`);
    });
    
    console.log('\n=== USER ROLES TABLE ===');
    const [roleCols] = await connection.execute('DESCRIBE user_roles');
    roleCols.forEach(col => {
      console.log(`${col.Field}: ${col.Type}`);
    });
    
    console.log('\n=== USERS WITH ROLES ===\n');
    const [users] = await connection.execute(`
      SELECT u.id, u.email, u.full_name, ur.role
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      ORDER BY ur.role, u.full_name
    `);
    
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

checkProfiles();
