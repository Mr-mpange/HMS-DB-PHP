const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'hospital_db',
      multipleStatements: true
    });

    console.log('Connected to database');

    // Read and execute migration
    const migrationFile = path.join(__dirname, 'migrations', 'add_visit_stage_columns.sql');
    const sql = fs.readFileSync(migrationFile, 'utf8');
    
    console.log('Running migration: add_visit_stage_columns.sql');
    await connection.query(sql);
    console.log('✅ Migration completed successfully');

    await connection.end();
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
