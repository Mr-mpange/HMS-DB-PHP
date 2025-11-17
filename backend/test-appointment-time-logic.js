// Test the appointment time logic
const now = new Date();
console.log('Current time:', now.toLocaleString());
console.log('');

// Test appointment times
const testAppointments = [
  { time: '09:00', date: new Date().toISOString().split('T')[0] },
  { time: '14:30', date: new Date().toISOString().split('T')[0] },
  { time: '16:00', date: new Date().toISOString().split('T')[0] },
  { time: '18:00', date: new Date().toISOString().split('T')[0] },
];

testAppointments.forEach(appt => {
  const appointmentDateTime = new Date(`${appt.date}T${appt.time}`);
  const fiveMinutesBefore = new Date(appointmentDateTime.getTime() - 5 * 60 * 1000);
  const canStart = now >= fiveMinutesBefore;
  
  const minutesUntil = Math.ceil((fiveMinutesBefore.getTime() - now.getTime()) / (1000 * 60));
  
  console.log(`Appointment at ${appt.time}:`);
  console.log(`  Can start: ${canStart ? '✅ YES' : '❌ NO'}`);
  if (!canStart) {
    console.log(`  Minutes until start: ${minutesUntil}`);
  }
  console.log('');
});

console.log('Note: Appointments can be started 5 minutes before scheduled time');
