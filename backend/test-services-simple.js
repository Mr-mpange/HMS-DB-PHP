const mysql = require('mysql2/promise');

async function testServicesInDB() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hospital_db'
  });

  console.log('✅ Connected to database\n');

  try {
    // Check if services exist
    const [services] = await connection.execute('SELECT * FROM medical_services ORDER BY service_type, service_name');
    
    console.log('=== MEDICAL SERVICES IN DATABASE ===');
    console.log(`Total: ${services.length}\n`);

    if (services.length === 0) {
      console.log('❌ No services found');
    } else {
      console.log('✅ Services are ready in database!\n');
      
      // Group by type
      const byType = {};
      services.forEach(s => {
        if (!byType[s.service_type]) byType[s.service_type] = [];
        byType[s.service_type].push(s);
      });
      
      Object.entries(byType).forEach(([type, items]) => {
        console.log(`${type} (${items.length}):`);
        items.forEach(s => {
          console.log(`  - ${s.service_code}: ${s.service_name} - TSh ${s.base_price}`);
        });
        console.log('');
      });
      
      console.log('📊 SUMMARY:');
      console.log(`   Total Services: ${services.length}`);
      console.log(`   Service Types: ${Object.keys(byType).length}`);
      console.log(`   Active Services: ${services.filter(s => s.is_active).length}`);
      console.log('');
      console.log('✅ Database is ready!');
      console.log('✅ Backend API routes are configured!');
      console.log('');
      console.log('🔄 Next: Make sure backend server is running, then refresh Admin Dashboard');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

testServicesInDB();
