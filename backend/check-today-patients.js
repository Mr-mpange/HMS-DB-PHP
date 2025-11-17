const db = require('./src/config/database');

async function checkTodayPatients() {
  try {
    console.log('Checking today\'s patients...\n');
    
    // Total visits created today
    const [totalToday] = await db.execute(`
      SELECT COUNT(*) as count 
      FROM patient_visits 
      WHERE DATE(created_at) = CURDATE()
    `);
    console.log('Total visits created today:', totalToday[0].count);
    
    // Completed visits today
    const [completedToday] = await db.execute(`
      SELECT COUNT(*) as count 
      FROM patient_visits 
      WHERE DATE(created_at) = CURDATE() 
      AND doctor_status = 'Completed'
    `);
    console.log('Completed visits today:', completedToday[0].count);
    
    // Get details of today's visits
    const [visits] = await db.execute(`
      SELECT 
        v.id,
        v.current_stage,
        v.doctor_status,
        v.created_at,
        p.full_name as patient_name
      FROM patient_visits v
      LEFT JOIN patients p ON v.patient_id = p.id
      WHERE DATE(v.created_at) = CURDATE()
      ORDER BY v.created_at DESC
    `);
    
    console.log(`\nToday's visits (${visits.length}):\n`);
    visits.forEach((v, i) => {
      console.log(`${i + 1}. ${v.patient_name}`);
      console.log(`   Stage: ${v.current_stage}`);
      console.log(`   Doctor Status: ${v.doctor_status || 'Not started'}`);
      console.log(`   Created: ${v.created_at}`);
      console.log('');
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkTodayPatients();
