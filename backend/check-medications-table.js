const mysql = require('mysql2/promise');

async function checkMedicationsTable() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hospital_db'
  });

  try {
    console.log('Checking medications table structure...\n');
    
    const [columns] = await connection.execute(`DESCRIBE medications`);
    
    console.log('Medications table columns:');
    columns.forEach(col => {
      console.log(`- ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

checkMedicationsTable();
