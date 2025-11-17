const axios = require('axios');

async function testDoctorQueueAPI() {
  try {
    console.log('Testing doctor queue API endpoint...\n');
    
    const response = await axios.get('http://localhost:3000/api/visits', {
      params: {
        current_stage: 'doctor',
        overall_status: 'Active',
        doctor_status_neq: 'Completed'
      }
    });
    
    const visits = response.data.visits || [];
    
    console.log(`✓ Found ${visits.length} patients waiting for doctor:\n`);
    
    visits.forEach((v, i) => {
      console.log(`${i + 1}. ${v.patient?.full_name || 'Unknown'}`);
      console.log(`   Visit ID: ${v.id}`);
      console.log(`   Doctor Status: ${v.doctor_status || 'Pending'}`);
      console.log(`   Nurse Completed: ${v.nurse_completed_at ? 'Yes' : 'No'}`);
      console.log('');
    });
    
    if (visits.length === 0) {
      console.log('No patients in queue. Register a patient and complete nurse vitals to test.');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

testDoctorQueueAPI();
