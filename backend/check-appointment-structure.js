const mysql = require('mysql2/promise');

async function checkAppointments() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hospital_db'
  });

  try {
    console.log('Checking appointments table structure...\n');
    
    // Get table structure
    const [columns] = await connection.execute(`
      DESCRIBE appointments
    `);
    
    console.log('Appointments table columns:');
    columns.forEach(col => {
      console.log(`- ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? `(${col.Key})` : ''}`);
    });
    
    console.log('\n\nSample appointments data:');
    const [appointments] = await connection.execute(`
      SELECT 
        id,
        patient_id,
        doctor_id,
        appointment_date,
        status,
        type,
        reason
      FROM appointments
      LIMIT 3
    `);
    
    appointments.forEach(appt => {
      console.log('\n---');
      console.log(`ID: ${appt.id}`);
      console.log(`Date: ${appt.appointment_date}`);
      console.log(`Status: ${appt.status}`);
      console.log(`Type: ${appt.type}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

checkAppointments();
