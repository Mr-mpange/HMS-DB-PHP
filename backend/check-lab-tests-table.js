const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkLabTestsTable() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'hospital_db'
    });

    console.log('Connected to database\n');

    // Check if lab_tests table exists
    const [tables] = await connection.query("SHOW TABLES LIKE 'lab_tests'");

    if (tables.length === 0) {
      console.log('❌ lab_tests table does NOT exist');
    } else {
      console.log('✅ lab_tests table exists\n');
      
      // Show table structure
      const [columns] = await connection.query('DESCRIBE lab_tests');
      console.log('Lab tests table structure:');
      console.table(columns);
    }

    await connection.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkLabTestsTable();
