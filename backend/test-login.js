const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

async function testLogin() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hospital_db'
  });

  try {
    console.log('Testing login functionality...\n');
    
    // Check if users table exists and has data
    const [users] = await connection.execute(`
      SELECT u.id, u.email, u.full_name, u.password_hash, u.is_active,
             GROUP_CONCAT(ur.role) as roles
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      GROUP BY u.id
      LIMIT 5
    `);
    
    console.log(`Total users found: ${users.length}\n`);
    
    if (users.length === 0) {
      console.log('❌ No users found in database!');
      console.log('You need to create a user first.');
      return;
    }
    
    users.forEach((user, index) => {
      console.log(`User ${index + 1}:`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Name: ${user.full_name}`);
      console.log(`  Active: ${user.is_active ? 'Yes' : 'No'}`);
      console.log(`  Roles: ${user.roles || 'None'}`);
      console.log(`  Has Password: ${user.password_hash ? 'Yes' : 'No'}`);
      console.log('');
    });
    
    // Test password verification for first user
    if (users.length > 0) {
      const testUser = users[0];
      console.log(`\nTesting password for: ${testUser.email}`);
      console.log('Try logging in with this email and the password you set.');
      console.log('\nIf you forgot the password, you can reset it by running:');
      console.log(`node backend/reset-password.js ${testUser.email} newpassword123`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

testLogin();
