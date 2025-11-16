const axios = require('axios');

async function testServicesAPI() {
  try {
    console.log('Testing medical services API on port 3000...\n');
    
    // First, login to get token
    console.log('=== LOGGING IN ===');
    const loginRes = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'admin@hospital.com',
      password: 'admin123'
    });
    
    const token = loginRes.data.token;
    console.log('✅ Logged in successfully\n');
    
    const config = {
      headers: { Authorization: `Bearer ${token}` }
    };
    
    // Test: Get all services
    console.log('=== GET /api/services ===');
    const response = await axios.get('http://localhost:3000/api/services', config);
    console.log('Status:', response.status);
    console.log('Total services:', response.data.count);
    console.log('\nFirst 10 services:');
    response.data.services.slice(0, 10).forEach((service, idx) => {
      console.log(`${idx + 1}. ${service.service_code}: ${service.service_name}`);
      console.log(`   Type: ${service.service_type}, Price: TSh ${service.base_price}`);
    });
    
    console.log('\n✅ API is working correctly!');
    console.log('The frontend should now be able to fetch this data.');
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('❌ Backend server is not running on port 3000');
      console.error('Please start the backend server first.');
    } else {
      console.error('❌ Error:', error.response?.data || error.message);
    }
  }
}

testServicesAPI();
