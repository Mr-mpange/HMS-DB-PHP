const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixInvalidProfile() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'hospital_db'
    });

    console.log('Connected to database\n');

    const invalidUserId = '1439a688-c221-11f0-a3f2-a44cc84261b5';
    
    // Check if this is a profile with invalid user_id
    const [profiles] = await connection.query(
      'SELECT * FROM profiles WHERE user_id = ?',
      [invalidUserId]
    );
    
    if (profiles.length > 0) {
      console.log('Found profile with invalid user_id:', profiles[0].full_name);
      console.log('Deleting invalid profile...');
      
      await connection.query(
        'DELETE FROM profiles WHERE user_id = ?',
        [invalidUserId]
      );
      
      console.log('✅ Invalid profile deleted');
    } else {
      console.log('No profile found with that user_id');
    }
    
    // Show all valid doctor profiles
    console.log('\nValid doctors in system:');
    const [doctors] = await connection.query(
      `SELECT u.id, u.full_name, u.email, ur.role
       FROM users u
       INNER JOIN user_roles ur ON u.id = ur.user_id
       WHERE ur.role = 'doctor' AND u.is_active = TRUE`
    );
    
    console.table(doctors);

    await connection.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixInvalidProfile();
