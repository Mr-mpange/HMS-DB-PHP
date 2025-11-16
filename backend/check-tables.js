const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkTables() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'hospital_db'
  });

  try {
    console.log('✅ Connected to database\n');
    
    // Show all tables
    const [tables] = await connection.execute('SHOW TABLES');
    
    console.log('=== TABLES IN DATABASE ===');
    tables.forEach((table, idx) => {
      const tableName = Object.values(table)[0];
      console.log(`${idx + 1}. ${tableName}`);
    });
    
    console.log('\n=== CHECKING BILLING RELATED TABLES ===\n');
    
    // Check invoices table structure
    try {
      const [invoicesCols] = await connection.execute('DESCRIBE invoices');
      console.log('✅ invoices table exists');
      console.log('Columns:', invoicesCols.map(c => c.Field).join(', '));
    } catch (e) {
      console.log('❌ invoices table does not exist');
    }
    
    console.log('');
    
    // Check invoice_items table
    try {
      const [itemsCols] = await connection.execute('DESCRIBE invoice_items');
      console.log('✅ invoice_items table exists');
      console.log('Columns:', itemsCols.map(c => c.Field).join(', '));
    } catch (e) {
      console.log('❌ invoice_items table does not exist');
    }
    
    console.log('');
    
    // Check payments table
    try {
      const [paymentsCols] = await connection.execute('DESCRIBE payments');
      console.log('✅ payments table exists');
      console.log('Columns:', paymentsCols.map(c => c.Field).join(', '));
    } catch (e) {
      console.log('❌ payments table does not exist');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkTables();
