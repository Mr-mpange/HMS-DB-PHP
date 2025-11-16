const mysql = require('mysql2/promise');

async function checkPharmacyWorkflow() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hospital_db'
  });

  try {
    console.log('Checking Pharmacy workflow...\n');
    
    // Check visits that should be in pharmacy
    const [visits] = await connection.execute(`
      SELECT 
        v.id,
        v.patient_id,
        p.full_name as patient_name,
        v.current_stage,
        v.doctor_status,
        v.pharmacy_status,
        v.created_at
      FROM patient_visits v
      LEFT JOIN patients p ON v.patient_id = p.id
      WHERE v.current_stage = 'pharmacy' AND v.overall_status = 'Active'
      ORDER BY v.created_at DESC
    `);
    
    console.log(`Visits in pharmacy stage: ${visits.length}\n`);
    
    if (visits.length > 0) {
      visits.forEach((v, i) => {
        console.log(`${i + 1}. ${v.patient_name}`);
        console.log(`   Visit ID: ${v.id}`);
        console.log(`   Doctor Status: ${v.doctor_status}`);
        console.log(`   Pharmacy Status: ${v.pharmacy_status}`);
        console.log('');
      });
    } else {
      console.log('❌ No visits in pharmacy stage!');
    }
    
    // Check prescriptions
    const [prescriptions] = await connection.execute(`
      SELECT 
        pr.id,
        pr.patient_id,
        p.full_name as patient_name,
        pr.status,
        pr.prescription_date,
        pr.medications
      FROM prescriptions pr
      LEFT JOIN patients p ON pr.patient_id = p.id
      ORDER BY pr.prescription_date DESC
      LIMIT 10
    `);
    
    console.log(`\nTotal prescriptions: ${prescriptions.length}\n`);
    
    if (prescriptions.length > 0) {
      prescriptions.forEach((pr, i) => {
        const meds = pr.medications ? JSON.parse(pr.medications) : [];
        console.log(`${i + 1}. ${pr.patient_name}`);
        console.log(`   Prescription ID: ${pr.id}`);
        console.log(`   Status: ${pr.status}`);
        console.log(`   Date: ${pr.prescription_date}`);
        console.log(`   Medications: ${meds.length}`);
        console.log('');
      });
    } else {
      console.log('❌ No prescriptions found!');
    }
    
    // Check if visits with prescriptions are in pharmacy
    console.log('\n=== WORKFLOW CHECK ===');
    
    const [visitWithPrescriptions] = await connection.execute(`
      SELECT 
        v.id as visit_id,
        v.patient_id,
        p.full_name as patient_name,
        v.current_stage,
        v.doctor_status,
        v.pharmacy_status,
        COUNT(pr.id) as prescription_count
      FROM patient_visits v
      LEFT JOIN patients p ON v.patient_id = p.id
      LEFT JOIN prescriptions pr ON v.patient_id = pr.patient_id
      WHERE v.doctor_status = 'Completed' AND v.overall_status = 'Active'
      GROUP BY v.id
      HAVING prescription_count > 0
    `);
    
    console.log(`Visits with completed doctor consultation and prescriptions: ${visitWithPrescriptions.length}\n`);
    
    if (visitWithPrescriptions.length > 0) {
      visitWithPrescriptions.forEach(v => {
        const shouldBeInPharmacy = v.current_stage === 'pharmacy';
        console.log(`${v.patient_name}:`);
        console.log(`  Current Stage: ${v.current_stage} ${shouldBeInPharmacy ? '✓' : '✗ Should be pharmacy'}`);
        console.log(`  Doctor Status: ${v.doctor_status}`);
        console.log(`  Pharmacy Status: ${v.pharmacy_status}`);
        console.log(`  Prescriptions: ${v.prescription_count}`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

checkPharmacyWorkflow();
