const mysql = require('mysql2/promise');

async function checkSettings() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hospital_db'
  });

  console.log('✅ Connected to database\n');

  try {
    // Check settings table
    const [settings] = await connection.execute('SELECT * FROM system_settings ORDER BY created_at DESC');

    console.log('=== SETTINGS IN DATABASE ===');
    console.log(`Total: ${settings.length}\n`);

    if (settings.length === 0) {
      console.log('❌ No settings found\n');
    } else {
      settings.forEach((setting, index) => {
        console.log(`${index + 1}. ${setting.setting_key}: ${setting.setting_value}`);
        console.log(`   ID: ${setting.id}`);
        console.log(`   Created: ${setting.created_at}`);
        console.log('');
      });
    }

    // Group settings by key for easier reading
    console.log('=== SETTINGS GROUPED ===\n');
    const grouped = {};
    settings.forEach(s => {
      grouped[s.setting_key] = s.setting_value;
    });

    console.log('consultation_fee:', grouped.consultation_fee || 'NOT SET');
    console.log('report_header:', grouped.report_header || 'NOT SET');
    console.log('hospital_name:', grouped.hospital_name || 'NOT SET');
    console.log('hospital_phone:', grouped.hospital_phone || 'NOT SET');
    console.log('hospital_email:', grouped.hospital_email || 'NOT SET');
    console.log('currency:', grouped.currency || 'NOT SET');
    console.log('enable_appointment_fees:', grouped.enable_appointment_fees || 'NOT SET');
    console.log('');

    // Check if there are any negative values
    console.log('=== CHECKING FOR ISSUES ===\n');
    
    const consultationFee = grouped.consultation_fee;
    if (consultationFee) {
      const feeValue = parseFloat(consultationFee);
      if (feeValue < 0) {
        console.log('⚠️  WARNING: consultation_fee is NEGATIVE:', feeValue);
      } else {
        console.log('✅ consultation_fee is positive:', feeValue);
      }
    } else {
      console.log('⚠️  consultation_fee is not set in database');
    }

    const reportHeader = grouped.report_header;
    if (!reportHeader || reportHeader.trim() === '') {
      console.log('⚠️  WARNING: report_header is EMPTY or not set');
    } else {
      console.log('✅ report_header is set:', reportHeader);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkSettings();
