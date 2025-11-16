const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkDoctor() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'hospital_db'
    });

    const doctorId = '1439a688-c221-11f0-a3f2-a44cc84261b5';
    
    console.log('Checking if doctor exists:', doctorId);
    
    const [users] = await connection.query(
      'SELECT * FROM users WHERE id = ?',
      [doctorId]
    );
    
    if (users.length === 0) {
      console.log('❌ Doctor NOT found in users table');
    } else {
      console.log('✅ Doctor found:', users[0].full_name);
    }

    await connection.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkDoctor();
