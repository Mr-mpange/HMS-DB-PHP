const axios = require('axios');

async function testAppointment() {
  try {
    console.log('Testing appointment creation...\n');
    
    // First login to get token
    const loginRes = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'admin@hospital.com',
      password: 'admin123'
    });
    
    const token = loginRes.data.token;
    console.log('✅ Logged in successfully\n');
    
    // Get a patient and doctor
    const patientsRes = await axios.get('http://localhost:3000/api/patients?limit=1', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const doctorsRes = await axios.get('http://localhost:3000/api/users/profiles?role=doctor&limit=1', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const patient = patientsRes.data.patients[0];
    const doctor = doctorsRes.data.profiles[0];
    
    console.log('Patient:', patient.full_name);
    console.log('Doctor:', doctor.full_name);
    console.log('');
    
    // Create appointment
    const appointmentData = {
      patient_id: patient.id,
      doctor_id: doctor.user_id,
      appointment_date: '2025-11-20',
      appointment_time: '14:00',
      appointment_type: 'Consultation',
      reason: 'Test appointment',
      notes: null
    };
    
    console.log('Creating appointment with data:', appointmentData);
    
    const response = await axios.post('http://localhost:3000/api/appointments', appointmentData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('\n✅ Appointment created successfully!');
    console.log('Appointment ID:', response.data.appointmentId);
  } catch (error) {
    console.error('\n❌ Appointment creation failed!');
    console.error('Status:', error.response?.status);
    console.error('Error:', error.response?.data);
    console.error('Details:', error.response?.data?.details);
  }
}

testAppointment();
