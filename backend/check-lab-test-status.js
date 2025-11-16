const mysql = require('mysql2/promise');

async function checkLabTestStatus() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hospital_db'
  });

  try {
    console.log('Checking lab test statuses...\n');
    
    // Get all lab tests
    const [tests] = await connection.execute(`
      SELECT 
        lt.id,
        lt.test_name,
        lt.status,
        lt.ordered_date,
        lt.updated_at,
        p.full_name as patient_name,
        u.full_name as doctor_name
      FROM lab_tests lt
      LEFT JOIN patients p ON lt.patient_id = p.id
      LEFT JOIN users u ON lt.doctor_id = u.id
      ORDER BY lt.ordered_date DESC
      LIMIT 20
    `);
    
    console.log(`Total lab tests: ${tests.length}\n`);
    
    // Group by status
    const byStatus = {};
    tests.forEach(t => {
      byStatus[t.status] = (byStatus[t.status] || 0) + 1;
    });
    
    console.log('Tests by status:');
    Object.entries(byStatus).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });
    
    console.log('\n\nRecent tests:');
    tests.slice(0, 10).forEach((t, i) => {
      console.log(`\n${i + 1}. ${t.test_name}`);
      console.log(`   Patient: ${t.patient_name}`);
      console.log(`   Status: ${t.status}`);
      console.log(`   Ordered: ${t.ordered_date}`);
      console.log(`   Updated: ${t.updated_at}`);
    });
    
    // Check if any tests have results
    const [testsWithResults] = await connection.execute(`
      SELECT 
        lt.id,
        lt.test_name,
        lt.status,
        lr.id as result_id,
        lr.result_text
      FROM lab_tests lt
      LEFT JOIN lab_results lr ON lt.id = lr.lab_test_id
      WHERE lr.id IS NOT NULL
      LIMIT 10
    `);
    
    console.log(`\n\nTests with results: ${testsWithResults.length}`);
    
    if (testsWithResults.length > 0) {
      console.log('\nTests that have results:');
      testsWithResults.forEach(t => {
        console.log(`  - ${t.test_name}: Status = ${t.status}, Result = ${t.result_text}`);
      });
    } else {
      console.log('\n⚠️  No tests have results yet. Submit some results in the Lab Dashboard.');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

checkLabTestStatus();
