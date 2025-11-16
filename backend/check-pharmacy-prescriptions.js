const mysql = require('mysql2/promise');

async function checkPharmacyPrescriptions() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hospital_db'
  });

  console.log('✅ Connected to database\n');

  try {
    // Get all prescriptions
    const [prescriptions] = await connection.execute(`
      SELECT 
        p.*,
        pat.full_name as patient_name,
        prof.full_name as doctor_name
      FROM prescriptions p
      LEFT JOIN patients pat ON p.patient_id = pat.id
      LEFT JOIN profiles prof ON p.doctor_id = prof.id
      ORDER BY p.created_at DESC
      LIMIT 20
    `);

    console.log('=== ALL PRESCRIPTIONS (Last 20) ===');
    console.log(`Total: ${prescriptions.length}\n`);

    if (prescriptions.length === 0) {
      console.log('❌ No prescriptions found\n');
    } else {
      prescriptions.forEach((presc, index) => {
        console.log(`${index + 1}. ${presc.patient_name || 'Unknown'} - Status: ${presc.status}`);
        console.log(`   ID: ${presc.id}`);
        console.log(`   Doctor: ${presc.doctor_name || 'Unknown'}`);
        console.log(`   Medications: ${presc.medications || 'None'}`);
        console.log(`   Created: ${presc.created_at}`);
        console.log('');
      });
    }

    // Get patients in pharmacy stage
    const [pharmacyVisits] = await connection.execute(`
      SELECT 
        v.*,
        p.full_name as patient_name
      FROM visits v
      LEFT JOIN patients p ON v.patient_id = p.id
      WHERE v.current_stage = 'pharmacy' 
        AND v.overall_status = 'Active'
      ORDER BY v.updated_at DESC
    `);

    console.log('=== PATIENTS IN PHARMACY STAGE ===');
    console.log(`Total: ${pharmacyVisits.length}\n`);

    if (pharmacyVisits.length === 0) {
      console.log('❌ No patients in pharmacy stage\n');
    } else {
      for (const visit of pharmacyVisits) {
        console.log(`Patient: ${visit.patient_name}`);
        console.log(`Visit ID: ${visit.id}`);
        console.log(`Patient ID: ${visit.patient_id}`);
        
        // Check prescriptions for this patient
        const [patientPrescriptions] = await connection.execute(`
          SELECT * FROM prescriptions 
          WHERE patient_id = ? 
          ORDER BY created_at DESC
        `, [visit.patient_id]);
        
        console.log(`Prescriptions: ${patientPrescriptions.length}`);
        if (patientPrescriptions.length > 0) {
          patientPrescriptions.forEach((presc, idx) => {
            console.log(`  ${idx + 1}. Status: ${presc.status}, Medications: ${presc.medications}`);
          });
        }
        console.log('');
      }
    }

    // Check active prescriptions
    const [activePrescriptions] = await connection.execute(`
      SELECT 
        p.*,
        pat.full_name as patient_name
      FROM prescriptions p
      LEFT JOIN patients pat ON p.patient_id = pat.id
      WHERE p.status IN ('Active', 'Pending')
      ORDER BY p.created_at DESC
    `);

    console.log('=== ACTIVE/PENDING PRESCRIPTIONS ===');
    console.log(`Total: ${activePrescriptions.length}\n`);

    if (activePrescriptions.length === 0) {
      console.log('❌ No active/pending prescriptions\n');
    } else {
      activePrescriptions.forEach((presc, index) => {
        console.log(`${index + 1}. ${presc.patient_name || 'Unknown'}`);
        console.log(`   ID: ${presc.id}`);
        console.log(`   Status: ${presc.status}`);
        console.log(`   Medications: ${presc.medications}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkPharmacyPrescriptions();
