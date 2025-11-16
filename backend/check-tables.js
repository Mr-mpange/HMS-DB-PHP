const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkTables() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'hospital_db'
    });

    console.log('Connected to database');

    // Check if patient_visits table exists
    const [tables] = await connection.query(
      "SHOW TABLES LIKE 'patient_visits'"
    );

    if (tables.length === 0) {
      console.log('❌ patient_visits table does NOT exist');
      console.log('Run: node backend/run-missing-tables-migration.js');
    } else {
      console.log('✅ patient_visits table exists');
      
      // Show table structure
      const [columns] = await connection.query(
        "DESCRIBE patient_visits"
      );
      console.log('\nTable structure:');
      console.table(columns);
    }

    // Check department_doctors table
    const [deptTables] = await connection.query(
      "SHOW TABLES LIKE 'department_doctors'"
    );

    if (deptTables.length === 0) {
      console.log('\n❌ department_doctors table does NOT exist');
    } else {
      console.log('\n✅ department_doctors table exists');
    }

    await connection.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkTables();
