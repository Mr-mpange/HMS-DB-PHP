const mysql = require('mysql2/promise');

async function verifyMedicalServices() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hospital_db'
  });

  console.log('✅ Connected to database\n');

  try {
    // Get table structure
    const [columns] = await connection.execute('DESCRIBE medical_services');
    
    console.log('=== MEDICAL_SERVICES TABLE STRUCTURE ===\n');
    columns.forEach(col => {
      console.log(`${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? `(${col.Key})` : ''}`);
    });
    console.log('');

    // Get sample data
    const [services] = await connection.execute('SELECT * FROM medical_services LIMIT 10');
    
    console.log('=== SAMPLE SERVICES (First 10) ===\n');
    services.forEach((service, index) => {
      console.log(`${index + 1}. ${service.service_code} - ${service.service_name}`);
      console.log(`   Type: ${service.service_type}`);
      console.log(`   Price: ${service.currency} ${service.base_price}`);
      console.log(`   Active: ${service.is_active ? 'Yes' : 'No'}`);
      console.log(`   Description: ${service.description}`);
      console.log('');
    });

    // Get statistics by service type
    const [stats] = await connection.execute(`
      SELECT 
        service_type,
        COUNT(*) as count,
        MIN(base_price) as min_price,
        MAX(base_price) as max_price,
        AVG(base_price) as avg_price
      FROM medical_services
      GROUP BY service_type
      ORDER BY count DESC
    `);

    console.log('=== STATISTICS BY SERVICE TYPE ===\n');
    stats.forEach(stat => {
      console.log(`${stat.service_type}:`);
      console.log(`  Count: ${stat.count}`);
      console.log(`  Price Range: TSh ${stat.min_price} - TSh ${stat.max_price}`);
      console.log(`  Average: TSh ${Math.round(stat.avg_price)}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

verifyMedicalServices();
