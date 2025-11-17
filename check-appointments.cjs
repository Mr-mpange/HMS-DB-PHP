const db = require('./backend/src/config/database');

async function checkAppointments() {
  try {
    const [rows] = await db.execute(
      'SELECT id, patient_id, doctor_id, appointment_date, status FROM appointments ORDER BY appointment_date DESC LIMIT 10'
    );
    
    console.log('\n=== Appointments in Database ===\n');
    console.log('Total appointments:', rows.length);
    console.log('\nDetails:');
    
    rows.forEach((r, idx) => {
      console.log(`\n${idx + 1}. Appointment ID: ${r.id}`);
      console.log(`   DateTime: ${r.appointment_date}`);
      console.log(`   Status: ${r.status}`);
      console.log(`   Doctor ID: ${r.doctor_id}`);
    });
    
    // Check today's date
    const today = new Date().toISOString().split('T')[0];
    console.log(`\n\nToday's date: ${today}`);
    
    const todayAppts = rows.filter(r => {
      const aptDate = r.appointment_date ? r.appointment_date.toString().split('T')[0] : '';
      return aptDate === today;
    });
    
    console.log(`Today's appointments: ${todayAppts.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkAppointments();
