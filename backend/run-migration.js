const fs = require('fs');
const db = require('./src/config/database');

async function runMigration() {
  try {
    const sql = fs.readFileSync('./migrations/create_patient_services_table.sql', 'utf8');
    
    await db.query(sql);
    
    console.log('✓ Migration completed successfully!');
    console.log('✓ patient_services table created');
    
    process.exit(0);
  } catch (error) {
    console.error('✗ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
