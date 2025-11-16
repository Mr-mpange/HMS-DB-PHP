const mysql = require('mysql2/promise');

async function checkDoctorQueue() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hospital_db'
  });

  try {
    console.log('Checking Doctor Dashboard queue...\n');
    
    // Query that matches what DoctorDashboard uses
    const [visits] = await connection.execute(`
      SELECT 
        v.id,
        v.patient_id,
        p.full_name as patient_name,
        v.current_stage,
        v.overall_status,
        v.doctor_status,
        v.lab_status,
        v.lab_completed_at
      FROM patient_visits v
      LEFT JOIN patients p ON v.patient_id = p.id
      WHERE v.current_stage = 'doctor' 
        AND v.overall_status = 'Active'
        AND v.doctor_status != 'Completed'
      ORDER BY v.created_at DESC
    `);
    
    console.log(`Visits that SHOULD appear in Doctor Dashboard: ${visits.length}\n`);
    
    if (visits.length === 0) {
      console.log('❌ No visits found for doctor!');
      console.log('\nPossible reasons:');
      console.log('1. No patients have been sent to doctor');
      console.log('2. All doctor consultations are completed');
      console.log('3. Lab results not submitted yet');
      return;
    }
    
    visits.forEach((v, i) => {
      console.log(`${i + 1}. ${v.patient_name}`);
      console.log(`   Visit ID: ${v.id}`);
      console.log(`   Current Stage: ${v.current_stage}`);
      console.log(`   Doctor Status: ${v.doctor_status}`);
      console.log(`   Lab Status: ${v.lab_status}`);
      console.log(`   Lab Completed: ${v.lab_completed_at || 'N/A'}`);
      
      if (v.lab_completed_at) {
        console.log('   📋 Has lab results - should show in "Lab Results Ready"');
      } else {
        console.log('   👤 New patient - should show in "Pending Consultations"');
      }
      console.log('');
    });
    
    console.log('\n✅ These patients should be visible in Doctor Dashboard!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

checkDoctorQueue();
