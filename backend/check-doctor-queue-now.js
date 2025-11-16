const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkDoctorQueue() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'hospital_db'
  });

  try {
    console.log('✅ Connected to database\n');
    
    // Check patients in doctor stage
    const [visits] = await connection.execute(`
      SELECT v.*, p.full_name as patient_name
      FROM patient_visits v
      LEFT JOIN patients p ON v.patient_id = p.id
      WHERE v.current_stage = 'doctor' AND v.overall_status = 'Active'
      ORDER BY v.updated_at DESC
    `);
    
    console.log('=== PATIENTS IN DOCTOR QUEUE ===');
    console.log(`Total: ${visits.length}\n`);
    
    if (visits.length > 0) {
      visits.forEach((visit, idx) => {
        console.log(`${idx + 1}. ${visit.patient_name}`);
        console.log(`   Visit ID: ${visit.id}`);
        console.log(`   Current Stage: ${visit.current_stage}`);
        console.log(`   Doctor Status: ${visit.doctor_status}`);
        console.log(`   Lab Status: ${visit.lab_status}`);
        console.log(`   Lab Completed: ${visit.lab_completed_at}`);
        console.log(`   Updated: ${visit.updated_at}`);
        console.log('');
      });
    } else {
      console.log('❌ No patients in doctor queue\n');
    }
    
    // Check all active visits
    console.log('=== ALL ACTIVE VISITS ===\n');
    const [allVisits] = await connection.execute(`
      SELECT v.*, p.full_name as patient_name
      FROM patient_visits v
      LEFT JOIN patients p ON v.patient_id = p.id
      WHERE v.overall_status = 'Active'
      ORDER BY v.updated_at DESC
    `);
    
    allVisits.forEach((visit, idx) => {
      console.log(`${idx + 1}. ${visit.patient_name} - Stage: ${visit.current_stage}`);
      console.log(`   Doctor Status: ${visit.doctor_status}`);
      console.log(`   Lab Status: ${visit.lab_status}`);
      console.log(`   Updated: ${visit.updated_at}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkDoctorQueue();
