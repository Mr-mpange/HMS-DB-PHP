const mysql = require('mysql2/promise');

async function testWorkflow() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hospital_db'
  });

  try {
    console.log('Testing Lab → Doctor workflow...\n');
    
    // Check current visits
    const [visits] = await connection.execute(`
      SELECT 
        v.id,
        p.full_name as patient_name,
        v.current_stage,
        v.lab_status,
        v.lab_completed_at,
        v.doctor_status,
        v.pharmacy_status
      FROM patient_visits v
      LEFT JOIN patients p ON v.patient_id = p.id
      WHERE v.overall_status = 'Active'
      ORDER BY v.created_at DESC
    `);
    
    console.log(`Active visits: ${visits.length}\n`);
    
    visits.forEach((v, i) => {
      console.log(`${i + 1}. ${v.patient_name}`);
      console.log(`   Current Stage: ${v.current_stage}`);
      console.log(`   Lab Status: ${v.lab_status}`);
      console.log(`   Lab Completed: ${v.lab_completed_at || 'Not completed'}`);
      console.log(`   Doctor Status: ${v.doctor_status}`);
      console.log(`   Pharmacy Status: ${v.pharmacy_status}`);
      console.log('');
    });
    
    // Check what happens after lab completion
    const labCompleted = visits.filter(v => v.lab_status === 'Completed');
    
    console.log('\n=== WORKFLOW CHECK ===');
    console.log(`Visits with completed lab: ${labCompleted.length}`);
    
    if (labCompleted.length > 0) {
      console.log('\nAfter lab completion, visits should:');
      labCompleted.forEach(v => {
        const shouldBeInDoctor = v.current_stage === 'doctor' && v.doctor_status === 'Pending';
        console.log(`\n${v.patient_name}:`);
        console.log(`  Current stage: ${v.current_stage} ${shouldBeInDoctor ? '✓' : '✗'}`);
        console.log(`  Doctor status: ${v.doctor_status} ${v.doctor_status === 'Pending' ? '✓' : '✗'}`);
        
        if (shouldBeInDoctor) {
          console.log('  ✓ CORRECT: Patient is back in doctor queue for prescription');
        } else {
          console.log('  ✗ WRONG: Patient should be in doctor stage with Pending status');
        }
      });
    }
    
    // Check if any visits went directly to pharmacy (WRONG)
    const directToPharmacy = visits.filter(v => 
      v.lab_status === 'Completed' && 
      v.current_stage === 'pharmacy' &&
      v.doctor_status !== 'Completed'
    );
    
    if (directToPharmacy.length > 0) {
      console.log('\n\n⚠️  WARNING: Found visits that went directly to pharmacy after lab!');
      console.log('These should have returned to doctor first:');
      directToPharmacy.forEach(v => {
        console.log(`  - ${v.patient_name} (${v.id})`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

testWorkflow();
