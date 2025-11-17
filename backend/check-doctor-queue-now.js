const db = require('./src/config/database');

async function checkDoctorQueue() {
  try {
    console.log('Checking doctor queue...\n');
    
    // Check all visits at doctor stage
    const [visits] = await db.execute(`
      SELECT 
        v.id,
        v.patient_id,
        v.doctor_id,
        v.current_stage,
        v.doctor_status,
        v.nurse_status,
        v.nurse_completed_at,
        v.overall_status,
        v.created_at,
        p.full_name as patient_name
      FROM patient_visits v
      LEFT JOIN patients p ON v.patient_id = p.id
      WHERE v.current_stage = 'doctor'
      ORDER BY v.created_at DESC
      LIMIT 20
    `);
    
    console.log(`Found ${visits.length} visits at doctor stage:\n`);
    
    if (visits.length === 0) {
      console.log('❌ No patients waiting for doctor');
      console.log('\nTo test the workflow:');
      console.log('1. Register a new patient (Receptionist Dashboard)');
      console.log('2. Complete vitals (Nurse Dashboard)');
      console.log('3. Patient should appear in Doctor Dashboard');
    } else {
      visits.forEach((v, i) => {
        console.log(`${i + 1}. Patient: ${v.patient_name || 'Unknown'}`);
        console.log(`   Visit ID: ${v.id}`);
        console.log(`   Doctor ID: ${v.doctor_id || 'Not assigned'}`);
        console.log(`   Doctor Status: ${v.doctor_status}`);
        console.log(`   Nurse Status: ${v.nurse_status}`);
        console.log(`   Nurse Completed: ${v.nurse_completed_at ? 'Yes' : 'No'}`);
        console.log(`   Overall Status: ${v.overall_status}`);
        console.log(`   Created: ${v.created_at}`);
        console.log('');
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkDoctorQueue();
