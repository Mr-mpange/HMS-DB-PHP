const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkInvoices() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'hospital_db'
  });

  try {
    console.log('✅ Connected to database\n');
    
    // Check invoices
    const [invoices] = await connection.execute(`
      SELECT i.*, p.full_name as patient_name
      FROM invoices i
      LEFT JOIN patients p ON i.patient_id = p.id
      ORDER BY i.created_at DESC
      LIMIT 10
    `);
    
    console.log('=== INVOICES ===');
    console.log(`Total invoices: ${invoices.length}\n`);
    
    if (invoices.length > 0) {
      invoices.forEach((inv, idx) => {
        console.log(`${idx + 1}. Invoice #${inv.invoice_number}`);
        console.log(`   Patient: ${inv.patient_name || 'Unknown'}`);
        console.log(`   Amount: ${inv.total_amount}`);
        console.log(`   Status: ${inv.status}`);
        console.log(`   Date: ${inv.invoice_date}`);
        console.log(`   Created: ${inv.created_at}`);
        console.log('');
      });
    } else {
      console.log('No invoices found in database\n');
    }
    
    // Check invoice items
    const [items] = await connection.execute(`
      SELECT ii.*, i.invoice_number
      FROM invoice_items ii
      LEFT JOIN invoices i ON ii.invoice_id = i.id
      ORDER BY ii.created_at DESC
      LIMIT 10
    `);
    
    console.log('=== INVOICE ITEMS ===');
    console.log(`Total items: ${items.length}\n`);
    
    if (items.length > 0) {
      items.forEach((item, idx) => {
        console.log(`${idx + 1}. ${item.description}`);
        console.log(`   Invoice: ${item.invoice_number || 'Unknown'}`);
        console.log(`   Quantity: ${item.quantity}`);
        console.log(`   Unit Price: ${item.unit_price}`);
        console.log(`   Total: ${item.total_price}`);
        console.log('');
      });
    } else {
      console.log('No invoice items found in database\n');
    }
    
    // Check patients in billing stage
    const [visits] = await connection.execute(`
      SELECT v.*, p.full_name as patient_name
      FROM patient_visits v
      LEFT JOIN patients p ON v.patient_id = p.id
      WHERE v.current_stage = 'billing' AND v.overall_status = 'Active'
      ORDER BY v.created_at DESC
    `);
    
    console.log('=== PATIENTS IN BILLING STAGE ===');
    console.log(`Total: ${visits.length}\n`);
    
    if (visits.length > 0) {
      visits.forEach((visit, idx) => {
        console.log(`${idx + 1}. ${visit.patient_name}`);
        console.log(`   Visit ID: ${visit.id}`);
        console.log(`   Stage: ${visit.current_stage}`);
        console.log(`   Billing Status: ${visit.billing_status}`);
        console.log('');
      });
    } else {
      console.log('No patients in billing stage\n');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkInvoices();
