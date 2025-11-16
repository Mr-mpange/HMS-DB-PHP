const mysql = require('mysql2/promise');

async function testAppointmentTime() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hospital_db'
  });

  try {
    console.log('Testing appointment time extraction...\n');
    
    const [appointments] = await connection.execute(`
      SELECT a.id,
             a.appointment_date as original_datetime,
             DATE(a.appointment_date) as appointment_date_only,
             TIME_FORMAT(a.appointment_date, '%H:%i') as appointment_time,
             p.full_name as patient_name,
             u.full_name as doctor_name,
             a.status
      FROM appointments a
      LEFT JOIN patients p ON a.patient_id = p.id
      LEFT JOIN users u ON a.doctor_id = u.id
      ORDER BY a.appointment_date DESC
      LIMIT 5
    `);
    
    console.log('Appointments with extracted time:');
    appointments.forEach(appt => {
      console.log('\n---');
      console.log(`ID: ${appt.id}`);
      console.log(`Patient: ${appt.patient_name}`);
      console.log(`Doctor: ${appt.doctor_name}`);
      console.log(`Original DateTime: ${appt.original_datetime}`);
      console.log(`Date Only: ${appt.appointment_date_only}`);
      console.log(`Time: ${appt.appointment_time}`);
      console.log(`Status: ${appt.status}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

testAppointmentTime();
