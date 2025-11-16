const mysql = require('mysql2/promise');

async function checkPrescriptionsTable() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hospital_db'
  });

  try {
    console.log('Checking prescriptions table structure...\n');
    
    const [columns] = await connection.execute(`DESCRIBE prescriptions`);
    
    console.log('Prescriptions table columns:');
    columns.forEach(col => {
      console.log(`- ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Default !== null ? `DEFAULT ${col.Default}` : ''}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

checkPrescriptionsTable();
