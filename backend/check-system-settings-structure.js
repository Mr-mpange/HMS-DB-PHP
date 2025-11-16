const mysql = require('mysql2/promise');

async function checkSystemSettingsStructure() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hospital_db'
  });

  console.log('✅ Connected to database\n');

  try {
    // Get table structure
    const [columns] = await connection.execute('DESCRIBE system_settings');
    
    console.log('=== SYSTEM_SETTINGS TABLE STRUCTURE ===\n');
    columns.forEach(col => {
      console.log(`${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? `(${col.Key})` : ''}`);
    });
    console.log('');

    // Get all data
    const [settings] = await connection.execute('SELECT * FROM system_settings');
    
    console.log('=== ALL DATA IN SYSTEM_SETTINGS ===');
    console.log(`Total rows: ${settings.length}\n`);
    
    if (settings.length > 0) {
      console.log('Sample row (first record):');
      console.log(JSON.stringify(settings[0], null, 2));
      console.log('');
      
      console.log('All records:');
      settings.forEach((row, index) => {
        console.log(`\n${index + 1}.`, JSON.stringify(row, null, 2));
      });
    } else {
      console.log('❌ No data in system_settings table');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkSystemSettingsStructure();
