const mysql = require('mysql2/promise');

async function testTodaysAppointments() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hospital_db'
  });

  try {
    const today = new Date().toISOString().split('T')[0];
    console.log('Today\'s date:', today);
    console.log('Testing today\'s appointments...\n');
    
    // Test 1: Get all appointments
    const [allAppointments] = await connection.execute(`
      SELECT 
        id,
        patient_id,
        doctor_id,
        appointment_date,
        DATE(appointment_date) as date_only,
        TIME_FORMAT(appointment_date, '%H:%i') as time_only,
        status
      FROM appointments
      ORDER BY appointment_date DESC
    `);
    
    console.log(`Total appointments in DB: ${allAppointments.length}\n`);
    
    allAppointments.forEach(appt => {
      console.log(`- Date: ${appt.date_only}, Time: ${appt.time_only}, Status: ${appt.status}`);
    });
    
    // Test 2: Get today's appointments
    console.log(`\n\nFiltering for today (${today}):`);
    const [todaysAppointments] = await connection.execute(`
      SELECT 
        id,
        patient_id,
        doctor_id,
        appointment_date,
        DATE(appointment_date) as date_only,
        TIME_FORMAT(appointment_date, '%H:%i') as time_only,
        status
      FROM appointments
      WHERE DATE(appointment_date) = ?
    `, [today]);
    
    console.log(`Today's appointments: ${todaysAppointments.length}`);
    
    if (todaysAppointments.length > 0) {
      todaysAppointments.forEach(appt => {
        console.log(`- Time: ${appt.time_only}, Status: ${appt.status}`);
      });
    } else {
      console.log('No appointments for today');
      console.log('\nAppointment dates in database:');
      allAppointments.forEach(appt => {
        console.log(`- ${appt.date_only} (${appt.status})`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

testTodaysAppointments();
