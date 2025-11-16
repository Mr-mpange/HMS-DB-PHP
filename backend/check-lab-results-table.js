const mysql = require('mysql2/promise');

async function checkLabResultsTable() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hospital_db'
  });

  try {
    console.log('Checking lab_results table...\n');
    
    // Check if table exists
    const [tables] = await connection.execute(`
      SHOW TABLES LIKE 'lab_results'
    `);
    
    if (tables.length === 0) {
      console.log('❌ lab_results table does NOT exist!');
      console.log('\nYou need to create the lab_results table.');
      return;
    }
    
    console.log('✓ lab_results table exists\n');
    
    // Get table structure
    const [columns] = await connection.execute(`DESCRIBE lab_results`);
    
    console.log('Columns:');
    columns.forEach(col => {
      console.log(`- ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    
    // Check for data
    const [count] = await connection.execute(`SELECT COUNT(*) as total FROM lab_results`);
    console.log(`\nTotal results in table: ${count[0].total}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

checkLabResultsTable();
