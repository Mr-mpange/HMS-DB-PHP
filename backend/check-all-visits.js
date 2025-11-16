const mysql = require('mysql2/promise');

async function checkAllVisits() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hospital_db'
  });

  try {
    console.log('Checking all visits...\n');
    
    const [visits] = await connection.execute(`
      SELECT 
        v.id,
        v.patient_id,
        p.full_name as patient_name,
        v.current_stage,
        v.overall_status,
        v.lab_status,
        v.doctor_status,
        v.created_at
      FROM patient_visits v
      LEFT JOIN patients p ON v.patient_id = p.id
      ORDER BY v.created_at DESC
      LIMIT 10
    `);
    
    console.log(`Total visits found: ${visits.length}\n`);
    
    if (visits.length === 0) {
      console.log('❌ No visits found in database!');
      console.log('\nThis means patients need to be checked in at reception first.');
      return;
    }
    
    visits.forEach((visit, index) => {
      console.log(`${index + 1}. Patient: ${visit.patient_name}`);
      console.log(`   Visit ID: ${visit.id}`);
      console.log(`   Current Stage: ${visit.current_stage}`);
      console.log(`   Overall Status: ${visit.overall_status}`);
      console.log(`   Lab Status: ${visit.lab_status}`);
      console.log(`   Doctor Status: ${visit.doctor_status}`);
      console.log('');
    });
    
    // Check stages
    const stages = {};
    visits.forEach(v => {
      stages[v.current_stage] = (stages[v.current_stage] || 0) + 1;
    });
    
    console.log('\nVisits by stage:');
    Object.entries(stages).forEach(([stage, count]) => {
      console.log(`- ${stage}: ${count}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

checkAllVisits();
