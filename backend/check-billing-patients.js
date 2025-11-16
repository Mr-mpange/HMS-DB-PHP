const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkBillingPatients() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'hospital_db'
  });

  try {
    console.log('✅ Connected to database\n');
    
    // Check patients in billing stage
    const [visits] = await connection.execute(`
      SELECT v.*, p.full_name as patient_name
      FROM patient_visits v
      LEFT JOIN patients p ON v.patient_id = p.id
      WHERE v.current_stage = 'billing' AND v.overall_status = 'Active'
      ORDER BY v.updated_at DESC
    `);
    
    console.log('=== PATIENTS IN BILLING STAGE ===');
    console.log(`Total: ${visits.length}\n`);
    
    if (visits.length > 0) {
      visits.forEach((visit, idx) => {
        console.log(`${idx + 1}. ${visit.patient_name}`);
        console.log(`   Visit ID: ${visit.id}`);
        console.log(`   Patient ID: ${visit.patient_id}`);
        console.log(`   Billing Status: ${visit.billing_status}`);
        console.log(`   Pharmacy Status: ${visit.pharmacy_status}`);
        console.log(`   Updated: ${visit.updated_at}`);
        console.log('');
      });
    }
    
    // Check invoices for these patients
    console.log('=== INVOICES ===\n');
    const [invoices] = await connection.execute(`
      SELECT i.*, p.full_name as patient_name
      FROM invoices i
      LEFT JOIN patients p ON i.patient_id = p.id
      ORDER BY i.created_at DESC
      LIMIT 10
    `);
    
    console.log(`Total invoices: ${invoices.length}\n`);
    
    if (invoices.length > 0) {
      invoices.forEach((inv, idx) => {
        console.log(`${idx + 1}. ${inv.patient_name}`);
        console.log(`   Invoice #: ${inv.invoice_number}`);
        console.log(`   Amount: ${inv.total_amount}`);
        console.log(`   Status: ${inv.status}`);
        console.log(`   Created: ${inv.created_at}`);
        console.log('');
      });
    } else {
      console.log('No invoices found\n');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkBillingPatients();
