const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkPatientTable() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'hospital_db'
    });

    console.log('Connected to database\n');

    // Show table structure
    const [columns] = await connection.query('DESCRIBE patients');
    console.log('Patients table structure:');
    console.table(columns);

    await connection.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkPatientTable();
