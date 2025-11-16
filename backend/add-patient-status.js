const mysql = require('mysql2/promise');
require('dotenv').config();

async function addPatientStatus() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'hospital_db'
  });

  try {
    console.log('✅ Connected to database\n');
    
    // Check if status column exists
    const [columns] = await connection.execute(`
      SHOW COLUMNS FROM patients LIKE 'status'
    `);
    
    if (columns.length > 0) {
      console.log('✓ Status column already exists');
    } else {
      console.log('Adding status column to patients table...');
      
      // Add status column
      await connection.execute(`
        ALTER TABLE patients 
        ADD COLUMN status ENUM('Active', 'Inactive', 'Deceased') DEFAULT 'Active'
        AFTER address
      `);
      
      console.log('✓ Status column added successfully');
    }
    
    // Update all existing patients to Active status
    const [result] = await connection.execute(`
      UPDATE patients 
      SET status = 'Active' 
      WHERE status IS NULL
    `);
    
    console.log(`✓ Updated ${result.affectedRows} patients to Active status`);
    
    // Show sample patients
    const [patients] = await connection.execute(`
      SELECT id, full_name, status 
      FROM patients 
      LIMIT 5
    `);
    
    console.log('\n=== Sample Patients ===');
    patients.forEach((p, idx) => {
      console.log(`${idx + 1}. ${p.full_name} - Status: ${p.status}`);
    });
    
    console.log('\n✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await connection.end();
  }
}

addPatientStatus();
