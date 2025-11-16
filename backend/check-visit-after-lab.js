const mysql = require('mysql2/promise');

async function checkVisitAfterLab() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hospital_db'
  });

  try {
    console.log('Checking visits after lab completion...\n');
    
    // Get visits that have lab_status = 'Completed'
    const [visits] = await connection.execute(`
      SELECT 
        v.id,
        v.patient_id,
        p.full_name as patient_name,
        v.current_stage,
        v.overall_status,
        v.lab_status,
        v.lab_completed_at,
        v.doctor_status,
        v.created_at
      FROM patient_visits v
      LEFT JOIN patients p ON v.patient_id = p.id
      WHERE v.lab_status = 'Completed'
      ORDER BY v.lab_completed_at DESC
      LIMIT 10
    `);
    
    console.log(`Found ${visits.length} visits with completed lab tests:\n`);
    
    visits.forEach((visit, index) => {
      console.log(`${index + 1}. Patient: ${visit.patient_name}`);
      console.log(`   Visit ID: ${visit.id}`);
      console.log(`   Current Stage: ${visit.current_stage}`);
      console.log(`   Overall Status: ${visit.overall_status}`);
      console.log(`   Lab Status: ${visit.lab_status}`);
      console.log(`   Lab Completed: ${visit.lab_completed_at}`);
      console.log(`   Doctor Status: ${visit.doctor_status}`);
      console.log(`   Created: ${visit.created_at}`);
      console.log('');
    });
    
    // Check if any should be visible to doctor
    const doctorVisits = visits.filter(v => 
      v.current_stage === 'doctor' && 
      v.overall_status === 'Active' &&
      v.doctor_status !== 'Completed'
    );
    
    console.log(`\nVisits that SHOULD appear in Doctor Dashboard: ${doctorVisits.length}`);
    
    if (doctorVisits.length > 0) {
      console.log('\nThese visits should be visible to doctor:');
      doctorVisits.forEach(v => {
        console.log(`- ${v.patient_name} (${v.id})`);
      });
    } else {
      console.log('\n⚠️  No visits are set to show in doctor dashboard!');
      console.log('Check if current_stage is "doctor" and doctor_status is not "Completed"');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

checkVisitAfterLab();
