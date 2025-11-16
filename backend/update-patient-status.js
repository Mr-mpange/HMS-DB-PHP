const mysql = require('mysql2/promise');
require('dotenv').config();

async function updatePatientStatus() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'hospital_db'
  });

  try {
    console.log('✅ Connected to database\n');
    
    // Mark patients as Inactive if no visit in last 24 hours
    const [result] = await connection.execute(`
      UPDATE patients p
      LEFT JOIN (
        SELECT patient_id, MAX(created_at) as last_visit
        FROM patient_visits
        GROUP BY patient_id
      ) v ON p.id = v.patient_id
      SET p.status = 'Inactive'
      WHERE p.status = 'Active'
        AND (v.last_visit IS NULL OR v.last_visit < DATE_SUB(NOW(), INTERVAL 24 HOUR))
    `);
    
    console.log(`✓ Marked ${result.affectedRows} patients as Inactive (no visit in 24 hours)`);
    
    // Mark patients as Active if they have a visit in last 24 hours
    const [result2] = await connection.execute(`
      UPDATE patients p
      INNER JOIN (
        SELECT patient_id, MAX(created_at) as last_visit
        FROM patient_visits
        GROUP BY patient_id
      ) v ON p.id = v.patient_id
      SET p.status = 'Active'
      WHERE v.last_visit >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
    `);
    
    console.log(`✓ Marked ${result2.affectedRows} patients as Active (visited in last 24 hours)`);
    
    console.log('\n✅ Patient status update completed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

updatePatientStatus();
