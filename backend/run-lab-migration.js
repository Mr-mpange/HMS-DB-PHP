const db = require('./src/config/database');
const fs = require('fs');

async function runMigration() {
  try {
    console.log('Running lab tests migration...\n');
    
    // Check if column already exists
    const [columns] = await db.execute("SHOW COLUMNS FROM lab_tests LIKE 'service_id'");
    
    if (columns.length > 0) {
      console.log('✓ service_id column already exists');
      process.exit(0);
      return;
    }
    
    console.log('Adding service_id column to lab_tests...');
    
    // Add column
    await db.execute(`
      ALTER TABLE lab_tests 
      ADD COLUMN service_id CHAR(36) NULL AFTER test_type
    `);
    console.log('✓ Added service_id column');
    
    // Add foreign key
    await db.execute(`
      ALTER TABLE lab_tests
      ADD CONSTRAINT fk_lab_tests_service 
        FOREIGN KEY (service_id) REFERENCES medical_services(id) 
        ON DELETE SET NULL
    `);
    console.log('✓ Added foreign key constraint');
    
    // Add index
    await db.execute(`
      CREATE INDEX idx_lab_tests_service_id ON lab_tests(service_id)
    `);
    console.log('✓ Added index');
    
    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
