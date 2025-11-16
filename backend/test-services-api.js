const axios = require('axios');

async function testServicesAPI() {
  try {
    console.log('Testing medical services API...\n');
    
    // First, login to get token
    console.log('=== LOGGING IN ===');
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@hospital.com',
      password: 'admin123'
    });
    
    const token = loginRes.data.token;
    console.log('✅ Logged in successfully\n');
    
    const config = {
      headers: { Authorization: `Bearer ${token}` }
    };
    
    // Test 1: Get all services
    console.log('=== GET /api/services ===');
    const response1 = await axios.get('http://localhost:5000/api/services', config);
    console.log('Status:', response1.status);
    console.log('Total services:', response1.data.count);
    console.log('Sample services:');
    response1.data.services.slice(0, 5).forEach(service => {
      console.log(`  - ${service.service_code}: ${service.service_name} (${service.service_type}) - TSh ${service.base_price}`);
    });
    console.log('\n');
    
    // Test 2: Get services by type
    console.log('=== GET /api/services?service_type=Consultation ===');
    const response2 = await axios.get('http://localhost:5000/api/services?service_type=Consultation', config);
    console.log('Status:', response2.status);
    console.log('Consultation services:', response2.data.count);
    response2.data.services.forEach(service => {
      console.log(`  - ${service.service_code}: ${service.service_name} - TSh ${service.base_price}`);
    });
    console.log('\n');
    
    // Test 3: Get active services only
    console.log('=== GET /api/services?is_active=true ===');
    const response3 = await axios.get('http://localhost:5000/api/services?is_active=true', config);
    console.log('Status:', response3.status);
    console.log('Active services:', response3.data.count);
    console.log('\n');
    
    console.log('✅ All tests passed!');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testServicesAPI();
