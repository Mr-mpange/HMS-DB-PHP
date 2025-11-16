const mysql = require('mysql2/promise');

async function testAppointments() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hospital_db'
  });

  try {
    console.log('Testing appointments query...\n');
    
    // Test 1: Get all appointments
    const [allAppointments] = await connection.execute(`
      SELECT a.*, 
             p.full_name as patient_name, p.phone as patient_phone,
             u.full_name as doctor_name
      FROM appointments a
      LEFT JOIN patients p ON a.patient_id = p.id
      LEFT JOIN users u ON a.doctor_id = u.id
      ORDER BY a.appointment_date DESC
    `);
    
    console.log(`Total appointments: ${allAppointments.length}`);
    console.log('\nAppointments:');
    allAppointments.forEach(appt => {
      console.log(`- ID: ${appt.id}`);
      console.log(`  Patient: ${appt.patient_name} (${appt.patient_id})`);
      console.log(`  Doctor: ${appt.doctor_name} (${appt.doctor_id})`);
      console.log(`  Date: ${appt.appointment_date}`);
      console.log(`  Status: ${appt.status}`);
      console.log(`  Type: ${appt.type}`);
      console.log('');
    });
    
    // Test 2: Check for specific patient
    if (allAppointments.length > 0) {
      const testPatientId = allAppointments[0].patient_id;
      console.log(`\nTesting query for patient: ${testPatientId}`);
      
      const [patientAppointments] = await connection.execute(`
        SELECT a.*, 
               p.full_name as patient_name, p.phone as patient_phone,
               u.full_name as doctor_name
        FROM appointments a
        LEFT JOIN patients p ON a.patient_id = p.id
        LEFT JOIN users u ON a.doctor_id = u.id
        WHERE a.patient_id = ?
        ORDER BY a.appointment_date DESC
      `, [testPatientId]);
      
      console.log(`Appointments for patient ${testPatientId}: ${patientAppointments.length}`);
    }
    
    // Test 3: Check for specific doctor
    if (allAppointments.length > 0) {
      const testDoctorId = allAppointments[0].doctor_id;
      console.log(`\nTesting query for doctor: ${testDoctorId}`);
      
      const [doctorAppointments] = await connection.execute(`
        SELECT a.*, 
               p.full_name as patient_name, p.phone as patient_phone,
               u.full_name as doctor_name
        FROM appointments a
        LEFT JOIN patients p ON a.patient_id = p.id
        LEFT JOIN users u ON a.doctor_id = u.id
        WHERE a.doctor_id = ?
        ORDER BY a.appointment_date DESC
      `, [testDoctorId]);
      
      console.log(`Appointments for doctor ${testDoctorId}: ${doctorAppointments.length}`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

testAppointments();
