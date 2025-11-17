const db = require('./src/config/database');

async function checkAppointmentsToday() {
  try {
    console.log('Checking today\'s appointments...\n');
    
    const [appointments] = await db.execute(`
      SELECT 
        a.id,
        a.patient_id,
        a.appointment_date,
        a.status,
        p.full_name as patient_name
      FROM appointments a
      LEFT JOIN patients p ON a.patient_id = p.id
      WHERE DATE(a.appointment_date) = CURDATE()
      ORDER BY a.appointment_date DESC
      LIMIT 10
    `);
    
    console.log(`Found ${appointments.length} appointments today:\n`);
    
    appointments.forEach((a, i) => {
      console.log(`${i + 1}. Patient: ${a.patient_name || 'NULL (patient_id: ' + a.patient_id + ')'}`);
      console.log(`   Time: ${a.appointment_date}`);
      console.log(`   Status: ${a.status}`);
      console.log('');
    });
    
    // Check if patient_id exists in patients table
    if (appointments.length > 0 && !appointments[0].patient_name) {
      console.log('⚠ Patient name is NULL - checking if patient exists...');
      const [patient] = await db.execute('SELECT id, full_name FROM patients WHERE id = ?', [appointments[0].patient_id]);
      if (patient.length === 0) {
        console.log('❌ Patient does NOT exist in patients table!');
      } else {
        console.log('✓ Patient exists:', patient[0].full_name);
        console.log('Issue: JOIN is not working properly');
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkAppointmentsToday();
