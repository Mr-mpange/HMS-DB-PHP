const db = require('./src/config/database');

async function checkServicesVsLabs() {
  try {
    console.log('Checking Medical Services vs Lab Tests...\n');
    
    // Count medical services
    const [services] = await db.execute('SELECT COUNT(*) as count FROM medical_services');
    console.log('Medical Services:', services[0].count);
    
    // Count lab tests
    const [labs] = await db.execute('SELECT COUNT(*) as count FROM lab_tests');
    console.log('Lab Tests:', labs[0].count);
    
    // Show sample medical services
    console.log('\nSample Medical Services:');
    const [sampleServices] = await db.execute('SELECT service_name, category, price FROM medical_services LIMIT 5');
    sampleServices.forEach(s => console.log(`  - ${s.service_name} (${s.category}) - TSh ${s.price}`));
    
    // Show sample lab tests
    console.log('\nSample Lab Tests:');
    const [sampleLabs] = await db.execute('SELECT test_name, test_type, normal_range FROM lab_tests LIMIT 5');
    sampleLabs.forEach(l => console.log(`  - ${l.test_name} (${l.test_type})${l.normal_range ? ' - Range: ' + l.normal_range : ''}`));
    
    console.log('\n✓ They are DIFFERENT tables with different purposes:');
    console.log('  - Medical Services: General hospital services (consultations, procedures, etc.)');
    console.log('  - Lab Tests: Laboratory diagnostic tests (blood tests, X-rays, etc.)');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkServicesVsLabs();
