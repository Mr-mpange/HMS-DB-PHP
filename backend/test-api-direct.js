const http = require('http');

function testAPI() {
  console.log('Testing if backend server is running...\n');
  
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/services',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const req = http.request(options, (res) => {
    console.log(`✅ Server is running!`);
    console.log(`Status Code: ${res.statusCode}\n`);
    
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      if (res.statusCode === 401) {
        console.log('⚠️  Authentication required (this is expected)');
        console.log('Response:', data);
        console.log('\n✅ Backend server is running and /api/services endpoint exists!');
        console.log('🔄 Now refresh your Admin Dashboard to see the services');
      } else if (res.statusCode === 200) {
        try {
          const parsed = JSON.parse(data);
          console.log('✅ Services fetched successfully!');
          console.log(`Total services: ${parsed.count || parsed.services?.length || 0}`);
          console.log('\n🔄 Refresh your Admin Dashboard to see the services');
        } catch (e) {
          console.log('Response:', data);
        }
      } else {
        console.log('Response:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Backend server is NOT running!');
    console.error('Error:', error.message);
    console.log('\n🔧 Please start the backend server:');
    console.log('   cd backend');
    console.log('   npm run dev');
  });

  req.end();
}

testAPI();
