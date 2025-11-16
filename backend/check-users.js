const mysql = require('mysql2/promise');

async function checkUsers() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hospital_db'
  });

  try {
    console.log('Checking users in database...\n');
    
    // Check if users table exists and has data
    const [users] = await connection.execute(`
      SELECT u.id, u.email, u.full_name, u.is_active, u.last_login,
             GROUP_CONCAT(ur.role) as roles,
             GROUP_CONCAT(CASE WHEN ur.is_primary THEN ur.role END) as primary_role
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      GROUP BY u.id
      ORDER BY u.created_at DESC
      LIMIT 10
    `);
    
    console.log(`Total users found: ${users.length}\n`);
    
    if (users.length === 0) {
      console.log('❌ No users found in database!');
      console.log('\nTo create a test user, run:');
      console.log('node backend/create-test-user.js');
      return;
    }
    
    console.log('Available users:\n');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   Name: ${user.full_name}`);
      console.log(`   Active: ${user.is_active ? '✓ Yes' : '✗ No'}`);
      console.log(`   Roles: ${user.roles || 'None'}`);
      console.log(`   Primary Role: ${user.primary_role || 'None'}`);
      console.log(`   Last Login: ${user.last_login || 'Never'}`);
      console.log('');
    });
    
    console.log('\n📝 To login, use one of these emails with the password you set.');
    console.log('\n⚠️  If you\'re getting "Too many requests" error:');
    console.log('   1. Wait 15 minutes for rate limit to reset');
    console.log('   2. OR restart the backend server');
    console.log('   3. Rate limit has been increased to 1000 requests per 15 minutes');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

checkUsers();
