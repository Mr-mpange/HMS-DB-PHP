const mysql = require('mysql2/promise');

async function checkDates() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hospital_db'
  });

  try {
    const [rows] = await connection.execute(
      'SELECT id, appointment_date, status FROM appointments ORDER BY appointment_date DESC LIMIT 5'
    );
    
    console.log('Database appointments (raw):');
    rows.forEach(row => {
      console.log({
        id: row.id.substring(0, 8),
        appointment_date: row.appointment_date,
        appointment_date_type: typeof row.appointment_date,
        appointment_date_constructor: row.appointment_date?.constructor?.name,
        status: row.status
      });
    });
    
    // Now test what happens when we format it
    console.log('\nFormatted for API response:');
    rows.forEach(row => {
      let appointmentDate = row.appointment_date;
      if (appointmentDate instanceof Date) {
        const year = appointmentDate.getFullYear();
        const month = String(appointmentDate.getMonth() + 1).padStart(2, '0');
        const day = String(appointmentDate.getDate()).padStart(2, '0');
        const hours = String(appointmentDate.getHours()).padStart(2, '0');
        const minutes = String(appointmentDate.getMinutes()).padStart(2, '0');
        const seconds = String(appointmentDate.getSeconds()).padStart(2, '0');
        appointmentDate = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
      }
      console.log({
        id: row.id.substring(0, 8),
        formatted: appointmentDate,
        status: row.status
      });
    });
    
  } finally {
    await connection.end();
  }
}

checkDates().catch(console.error);
