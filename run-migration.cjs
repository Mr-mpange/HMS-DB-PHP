const db = require('./backend/src/config/database');
const fs = require('fs');

async function runMigration() {
  try {
    console.log('Running migration...');
    
    const sql = fs.readFileSync('./backend/migrations/add_doctor_to_visits.sql', 'utf8');
    const statements = sql.split(';').filter(s => s.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('Executing:', statement.substring(0, 50) + '...');
        await db.execute(statement);
      }
    }
    
    console.log('✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
