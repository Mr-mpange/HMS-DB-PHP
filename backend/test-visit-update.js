const mysql = require('mysql2/promise');

async function testVisitUpdate() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hospital_db'
  });

  try {
    console.log('Testing visit update after lab completion...\n');
    
    // Get a visit that's in lab stage
    const [visits] = await connection.execute(`
      SELECT 
        v.id,
        v.patient_id,
        p.full_name as patient_name,
        v.current_stage,
        v.lab_status,
        v.doctor_status
      FROM patient_visits v
      LEFT JOIN patients p ON v.patient_id = p.id
      WHERE v.current_stage = 'lab' AND v.overall_status = 'Active'
      LIMIT 1
    `);
    
    if (visits.length === 0) {
      console.log('❌ No visits in lab stage found');
      return;
    }
    
    const visit = visits[0];
    console.log('Found visit in lab stage:');
    console.log(`  Patient: ${visit.patient_name}`);
    console.log(`  Visit ID: ${visit.id}`);
    console.log(`  Current Stage: ${visit.current_stage}`);
    console.log(`  Lab Status: ${visit.lab_status}`);
    console.log(`  Doctor Status: ${visit.doctor_status}`);
    
    console.log('\n\nSimulating lab completion update...');
    
    // Update the visit as if lab completed
    await connection.execute(`
      UPDATE patient_visits 
      SET 
        lab_status = 'Completed',
        lab_completed_at = NOW(),
        current_stage = 'doctor',
        doctor_status = 'Pending'
      WHERE id = ?
    `, [visit.id]);
    
    console.log('✓ Update executed');
    
    // Verify the update
    const [updated] = await connection.execute(`
      SELECT 
        id,
        current_stage,
        lab_status,
        lab_completed_at,
        doctor_status
      FROM patient_visits
      WHERE id = ?
    `, [visit.id]);
    
    console.log('\n\nAfter update:');
    console.log(`  Current Stage: ${updated[0].current_stage}`);
    console.log(`  Lab Status: ${updated[0].lab_status}`);
    console.log(`  Lab Completed: ${updated[0].lab_completed_at}`);
    console.log(`  Doctor Status: ${updated[0].doctor_status}`);
    
    if (updated[0].current_stage === 'doctor' && updated[0].doctor_status === 'Pending') {
      console.log('\n✅ SUCCESS! Visit correctly updated to return to doctor');
    } else {
      console.log('\n❌ FAILED! Visit not updated correctly');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

testVisitUpdate();
