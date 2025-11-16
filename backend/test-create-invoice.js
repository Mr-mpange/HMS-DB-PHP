const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

async function testCreateInvoice() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'hospital_db'
  });

  try {
    console.log('✅ Connected to database\n');
    
    // Get a patient in billing stage
    const [visits] = await connection.execute(`
      SELECT v.*, p.full_name
      FROM patient_visits v
      LEFT JOIN patients p ON v.patient_id = p.id
      WHERE v.current_stage = 'billing' AND v.overall_status = 'Active'
      LIMIT 1
    `);
    
    if (visits.length === 0) {
      console.log('❌ No patients in billing stage');
      return;
    }
    
    const visit = visits[0];
    console.log(`Creating invoice for: ${visit.full_name}`);
    console.log(`Patient ID: ${visit.patient_id}\n`);
    
    const invoiceId = uuidv4();
    const invoiceNumber = `INV-TEST-${Date.now()}`;
    const items = [
      {
        description: 'Amlodipine 5mg - 5mg (Once daily)',
        item_type: 'Medication',
        quantity: 30,
        unit_price: 300,
        total_price: 9000
      }
    ];
    
    const totalAmount = 9000;
    
    await connection.execute(
      `INSERT INTO invoices (
        id, invoice_number, patient_id, visit_id, invoice_date,
        total_amount, paid_amount, balance, status, items, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        invoiceId,
        invoiceNumber,
        visit.patient_id,
        visit.id,
        new Date().toISOString().split('T')[0],
        totalAmount,
        0,
        totalAmount,
        'Pending',
        JSON.stringify(items),
        'Test invoice from pharmacy'
      ]
    );
    
    console.log('✅ Invoice created successfully!');
    console.log(`Invoice Number: ${invoiceNumber}`);
    console.log(`Amount: ${totalAmount} TSH\n`);
    
    // Verify it was created
    const [invoices] = await connection.execute(
      'SELECT * FROM invoices WHERE id = ?',
      [invoiceId]
    );
    
    console.log('Invoice in database:', invoices[0]);
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await connection.end();
  }
}

testCreateInvoice();
