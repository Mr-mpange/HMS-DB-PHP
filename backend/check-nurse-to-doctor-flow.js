const db = require('./src/config/database');

async function checkNurseToDoctorFlow() {
  try {
    console.log('Checking nurse to doctor workflow...\n');
    
    // Check all recent visits
    const [allVisits] = await db.execute(`
      SELECT 
        v.id,
        v.patient_id,
        v.current_stage,
        v.nurse_status,
        v.nurse_completed_at,
        v.doctor_status,
        v.doctor_completed_at,
        v.overall_status,
        v.created_at,
        p.full_name as patient_name
      FROM patient_visits v
      LEFT JOIN patients p ON v.patient_id = p.id
      ORDER BY v.created_at DESC
      LIMIT 10
    `);
    
    console.log(`Found ${allVisits.length} recent visits:\n`);
    
    allVisits.forEach((v, i) => {
      console.log(`${i + 1}. ${v.patient_name || 'Unknown'}`);
      console.log(`   Current Stage: ${v.current_stage}`);
      console.log(`   Nurse Status: ${v.nurse_status} ${v.nurse_completed_at ? '✓ Completed' : ''}`);
      console.log(`   Doctor Status: ${v.doctor_status} ${v.doctor_completed_at ? '✓ Completed' : ''}`);
      console.log(`   Overall: ${v.overall_status}`);
      console.log(`   Created: ${v.created_at}`);
      console.log('');
    });
    
    // Check visits that completed nurse but not at doctor stage
    const [stuckVisits] = await db.execute(`
      SELECT 
        v.id,
        v.current_stage,
        v.nurse_status,
        v.nurse_completed_at,
        v.doctor_status,
        p.full_name as patient_name
      FROM patient_visits v
      LEFT JOIN patients p ON v.patient_id = p.id
      WHERE v.nurse_status = 'Completed' 
        AND v.nurse_completed_at IS NOT NULL
        AND v.current_stage != 'doctor'
        AND v.overall_status = 'Active'
    `);
    
    if (stuckVisits.length > 0) {
      console.log('⚠️  ISSUE FOUND: Patients completed nurse but not moved to doctor stage:');
      stuckVisits.forEach(v => {
        console.log(`   - ${v.patient_name}: Stage=${v.current_stage}, Nurse=${v.nurse_status}`);
      });
      console.log('');
    }
    
    // Check visits at doctor stage
    const [doctorQueue] = await db.execute(`
      SELECT 
        v.id,
        v.doctor_status,
        p.full_name as patient_name
      FROM patient_visits v
      LEFT JOIN patients p ON v.patient_id = p.id
      WHERE v.current_stage = 'doctor'
        AND v.overall_status = 'Active'
    `);
    
    console.log(`✓ Patients at doctor stage: ${doctorQueue.length}`);
    if (doctorQueue.length > 0) {
      doctorQueue.forEach(v => {
        console.log(`   - ${v.patient_name}: Doctor Status=${v.doctor_status}`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkNurseToDoctorFlow();
