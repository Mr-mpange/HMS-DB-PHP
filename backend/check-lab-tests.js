const mysql = require('mysql2/promise');

async function checkLabTests() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hospital_db'
  });

  try {
    console.log('Checking lab_tests table...\n');
    
    // Get table structure
    const [columns] = await connection.execute(`DESCRIBE lab_tests`);
    
    console.log('Lab tests table columns:');
    columns.forEach(col => {
      console.log(`- ${col.Field}: ${col.Type}`);
    });
    
    // Get all lab tests
    const [labTests] = await connection.execute(`
      SELECT 
        lt.id,
        lt.patient_id,
        lt.doctor_id,
        lt.test_name,
        lt.test_type,
        lt.status,
        lt.priority,
        lt.ordered_date,
        p.full_name as patient_name,
        u.full_name as doctor_name
      FROM lab_tests lt
      LEFT JOIN patients p ON lt.patient_id = p.id
      LEFT JOIN users u ON lt.doctor_id = u.id
      ORDER BY lt.ordered_date DESC
    `);
    
    console.log(`\n\nTotal lab tests: ${labTests.length}\n`);
    
    if (labTests.length > 0) {
      labTests.forEach(test => {
        console.log('---');
        console.log(`ID: ${test.id}`);
        console.log(`Patient: ${test.patient_name}`);
        console.log(`Doctor: ${test.doctor_name}`);
        console.log(`Test: ${test.test_name} (${test.test_type})`);
        console.log(`Status: ${test.status}`);
        console.log(`Priority: ${test.priority}`);
        console.log(`Ordered: ${test.ordered_date}`);
        console.log('');
      });
      
      // Count by status
      const statusCounts = {};
      labTests.forEach(test => {
        statusCounts[test.status] = (statusCounts[test.status] || 0) + 1;
      });
      
      console.log('\nStatus counts:');
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`- ${status}: ${count}`);
      });
    } else {
      console.log('No lab tests found in database');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

checkLabTests();
