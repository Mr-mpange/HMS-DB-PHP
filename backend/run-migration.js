const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'hospital_db',
      multipleStatements: true
    });

    console.log('✅ Connected to database');

    // Read migration file
    const migrationPath = path.join(__dirname, 'migrations', 'add_missing_tables.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('📝 Running migration...');

    // Execute migration
    await connection.query(sql);

    console.log('✅ Migration completed successfully!');
    console.log('');
    console.log('Tables created:');
    console.log('  - departments');
    console.log('  - patient_visits');
    console.log('  - payments');
    console.log('  - system_settings');
    console.log('  - department_fees');
    console.log('  - insurance_companies');
    console.log('  - insurance_claims');
    console.log('');
    console.log('Sample data inserted:');
    console.log('  - 6 system settings');
    console.log('  - 5 departments');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

runMigration();
