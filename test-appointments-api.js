const axios = require('axios');

async function testAppointments() {
  try {
    // You'll need to replace this with a valid token from your browser's localStorage
    const token = 'YOUR_TOKEN_HERE';
    
    const response = await axios.get('http://localhost:3000/api/appointments', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('First 3 appointments:');
    response.data.appointments.slice(0, 3).forEach(apt => {
      console.log({
        id: apt.id,
        patient: apt.patient_name,
        appointment_date: apt.appointment_date,
        appointment_date_type: typeof apt.appointment_date,
        appointment_date_only: apt.appointment_date_only,
        appointment_time: apt.appointment_time,
        status: apt.status
      });
    });
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

testAppointments();
