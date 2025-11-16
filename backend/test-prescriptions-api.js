const axios = require('axios');

async function testPrescriptionsAPI() {
  try {
    console.log('Testing prescriptions API...\n');
    
    // Test 1: Get all prescriptions
    console.log('=== GET /api/prescriptions ===');
    const response1 = await axios.get('http://localhost:5000/api/prescriptions?limit=10');
    console.log('Status:', response1.status);
    console.log('Data:', JSON.stringify(response1.data, null, 2));
    console.log('\n');
    
    // Test 2: Get prescriptions with status filter
    console.log('=== GET /api/prescriptions?status=Active ===');
    try {
      const response2 = await axios.get('http://localhost:5000/api/prescriptions?status=Active');
      console.log('Status:', response2.status);
      console.log('Data:', JSON.stringify(response2.data, null, 2));
    } catch (error) {
      console.log('Error:', error.response?.data || error.message);
    }
    console.log('\n');
    
    // Test 3: Get prescriptions with status Pending
    console.log('=== GET /api/prescriptions?status=Pending ===');
    try {
      const response3 = await axios.get('http://localhost:5000/api/prescriptions?status=Pending');
      console.log('Status:', response3.status);
      console.log('Data:', JSON.stringify(response3.data, null, 2));
    } catch (error) {
      console.log('Error:', error.response?.data || error.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testPrescriptionsAPI();
