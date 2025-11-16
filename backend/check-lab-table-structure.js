const mysql = require('mysql2/promise');

async function checkLabTableStructure() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hospital_db'
  });

  try {
    console.log('Checking lab_tests table structure...\n');
    
    const [columns] = await connection.execute(`DESCRIBE lab_tests`);
    
    console.log('Columns:');
    columns.forEach(col => {
      console.log(`- ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Default !== null ? `DEFAULT ${col.Default}` : ''}`);
    });
    
    // Check if there's a notes column
    const hasNotes = columns.some(col => col.Field === 'notes');
    const hasInstructions = columns.some(col => col.Field === 'instructions');
    const hasCompletedDate = columns.some(col => col.Field === 'completed_date');
    
    console.log('\n\nColumn checks:');
    console.log(`- Has 'notes' column: ${hasNotes ? '✓' : '✗'}`);
    console.log(`- Has 'instructions' column: ${hasInstructions ? '✓' : '✗'}`);
    console.log(`- Has 'completed_date' column: ${hasCompletedDate ? '✗ (might be issue)' : '✓'}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

checkLabTableStructure();
