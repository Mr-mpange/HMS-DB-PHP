const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');

async function fixSettingsIssues() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hospital_db'
  });

  console.log('✅ Connected to database\n');

  try {
    // Fix 1: Update consultation_fee from -2000 to 50000
    console.log('=== FIXING CONSULTATION FEE ===');
    const [consultationFeeResult] = await connection.execute(
      'UPDATE system_settings SET value = ?, updated_at = NOW() WHERE `key` = ?',
      ['50000', 'consultation_fee']
    );
    console.log('✅ Updated consultation_fee from -2000 to 50000');
    console.log(`   Rows affected: ${consultationFeeResult.affectedRows}\n`);

    // Fix 2: Add report_header if it doesn't exist
    console.log('=== ADDING REPORT HEADER ===');
    
    // Check if report_header exists
    const [existing] = await connection.execute(
      'SELECT * FROM system_settings WHERE `key` = ?',
      ['report_header']
    );

    if (existing.length === 0) {
      // Insert new report_header
      const id = uuidv4();
      await connection.execute(
        'INSERT INTO system_settings (id, `key`, value, description, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
        [id, 'report_header', 'Healthcare Management System Report', 'Report header text']
      );
      console.log('✅ Added report_header setting');
    } else {
      // Update existing report_header if it's empty
      if (!existing[0].value || existing[0].value.trim() === '') {
        await connection.execute(
          'UPDATE system_settings SET value = ?, updated_at = NOW() WHERE `key` = ?',
          ['Healthcare Management System Report', 'report_header']
        );
        console.log('✅ Updated empty report_header');
      } else {
        console.log('✅ report_header already exists with value:', existing[0].value);
      }
    }

    // Verify the fixes
    console.log('\n=== VERIFYING FIXES ===\n');
    const [settings] = await connection.execute(
      'SELECT * FROM system_settings WHERE `key` IN (?, ?)',
      ['consultation_fee', 'report_header']
    );

    settings.forEach(setting => {
      console.log(`${setting.key}: ${setting.value}`);
    });

    console.log('\n✅ All fixes applied successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

fixSettingsIssues();
