const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkMedicationPrices() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'hospital_db'
  });

  try {
    console.log('✅ Connected to database\n');
    
    // Check medications with their prices
    const [medications] = await connection.execute(`
      SELECT id, name, unit_price, stock_quantity
      FROM medications
      ORDER BY name
      LIMIT 20
    `);
    
    console.log('=== MEDICATIONS AND PRICES ===\n');
    
    medications.forEach((med, idx) => {
      console.log(`${idx + 1}. ${med.name}`);
      console.log(`   Price: ${med.unit_price || 'NOT SET'} TSH`);
      console.log(`   Stock: ${med.stock_quantity}`);
      console.log('');
    });
    
    const withoutPrice = medications.filter(m => !m.unit_price || m.unit_price === 0);
    console.log(`\n⚠️  ${withoutPrice.length} medications have no price set\n`);
    
    if (withoutPrice.length > 0) {
      console.log('Medications without prices:');
      withoutPrice.forEach(m => console.log(`  - ${m.name}`));
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkMedicationPrices();
