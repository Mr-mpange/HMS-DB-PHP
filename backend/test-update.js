const mysql = require('mysql2/promise');

async function testUpdate() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'hospital_management'
  });

  try {
    const prescriptionId = '82d305dc-cfcf-4a8a-8fb5-176be9b7a794';
    
    // Test the update query
    const updates = ['status = ?', 'dispensed_date = ?', 'updated_at = CURRENT_TIMESTAMP'];
    const values = ['Dispensed', new Date().toISOString(), prescriptionId];
    
    console.log('Query:', `UPDATE prescriptions SET ${updates.join(', ')} WHERE id = ?`);
    console.log('Values:', values);
    
    const [result] = await connection.execute(
      `UPDATE prescriptions SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    
    console.log('Update result:', result);
    console.log('Rows affected:', result.affectedRows);
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await connection.end();
  }
}

testUpdate();
