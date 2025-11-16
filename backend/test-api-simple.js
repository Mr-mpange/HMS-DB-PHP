const axios = require('axios');

async function test() {
  try {
    // Test if server is responding
    const response = await axios.get('http://localhost:3000/api/services', {
      headers: { Authorization: 'Bearer test' },
      timeout: 5000
    }).catch(err => {
      console.log('Error response:', err.response?.status, err.response?.data);
      return err.response;
    });
    
    if (response) {
      console.log('Server responded with status:', response.status);
      console.log('Data:', JSON.stringify(response.data, null, 2));
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
  process.exit(0);
}

test();
