const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

async function createDefaultSettings() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'hospital_db'
    });

    console.log('Connected to database\n');

    // Check if system_settings table exists
    const [tables] = await connection.query(
      "SHOW TABLES LIKE 'system_settings'"
    );

    if (tables.length === 0) {
      console.log('Creating system_settings table...');
      await connection.query(`
        CREATE TABLE system_settings (
          id VARCHAR(36) PRIMARY KEY,
          \`key\` VARCHAR(255) UNIQUE NOT NULL,
          value TEXT NOT NULL,
          description TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB
      `);
      console.log('✅ system_settings table created');
    } else {
      console.log('✅ system_settings table exists');
    }

    // Insert default settings
    const defaultSettings = [
      { key: 'consultation_fee', value: '50000', description: 'Default consultation fee in TSh' },
      { key: 'currency', value: 'TSh', description: 'Currency symbol' },
      { key: 'hospital_name', value: 'Hospital Management System', description: 'Hospital name' }
    ];

    for (const setting of defaultSettings) {
      const [existing] = await connection.query(
        'SELECT id FROM system_settings WHERE `key` = ?',
        [setting.key]
      );

      if (existing.length === 0) {
        await connection.query(
          'INSERT INTO system_settings (id, `key`, value, description) VALUES (?, ?, ?, ?)',
          [uuidv4(), setting.key, setting.value, setting.description]
        );
        console.log(`✅ Created setting: ${setting.key} = ${setting.value}`);
      } else {
        console.log(`⏭️  Setting already exists: ${setting.key}`);
      }
    }

    console.log('\n✅ Default settings created successfully');
    await connection.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createDefaultSettings();
