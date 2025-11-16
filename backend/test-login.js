const axios = require('axios');

async function testLogin() {
  try {
    console.log('Testing login endpoint...\n');
    
    const response = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'admin@hospital.com',
      password: 'admin123'
    });
    
    console.log('✅ Login successful!');
    console.log('Token:', response.data.token ? 'Present' : 'Missing');
    console.log('User:', response.data.user);
    console.log('Roles:', response.data.user.roles);
  } catch (error) {
    console.error('❌ Login failed!');
    console.error('Status:', error.response?.status);
    console.error('Error:', error.response?.data);
    console.error('Message:', error.message);
  }
}

testLogin();
