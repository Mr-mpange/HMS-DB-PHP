const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function checkUsers() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'hospital_db'
    });

    console.log('Connected to database\n');

    // Check all users
    const [users] = await connection.query(
      `SELECT u.id, u.email, u.full_name, u.is_active, u.email_verified,
              GROUP_CONCAT(ur.role) as roles
       FROM users u
       LEFT JOIN user_roles ur ON u.id = ur.user_id
       GROUP BY u.id`
    );

    if (users.length === 0) {
      console.log('❌ No users found in database!');
      console.log('\nYou need to create users. Run: node backend/create-admin.js');
    } else {
      console.log(`✅ Found ${users.length} user(s):\n`);
      users.forEach(user => {
        console.log(`Email: ${user.email}`);
        console.log(`Name: ${user.full_name || 'N/A'}`);
        console.log(`Active: ${user.is_active ? 'Yes' : 'No'}`);
        console.log(`Roles: ${user.roles || 'No roles assigned'}`);
        console.log('---');
      });
      
      // Test password for admin
      const adminUser = users.find(u => u.email === 'admin@hospital.com');
      if (adminUser) {
        const [userWithHash] = await connection.query(
          'SELECT password_hash FROM users WHERE email = ?',
          ['admin@hospital.com']
        );
        
        if (userWithHash.length > 0) {
          const testPassword = 'admin123';
          const isValid = await bcrypt.compare(testPassword, userWithHash[0].password_hash);
          console.log(`\nPassword test for admin@hospital.com with "admin123": ${isValid ? '✅ Valid' : '❌ Invalid'}`);
        }
      }
    }

    await connection.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkUsers();
