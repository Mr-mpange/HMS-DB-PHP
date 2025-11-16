# ReceptionistDashboard Migration Guide

## Overview
ReceptionistDashboard.tsx has ~30 Supabase calls that need to be replaced with backend API calls.

## All Supabase Calls to Replace

### 1. Realtime Subscriptions (Lines ~122-188)
```typescript
// REMOVE:
const appointmentsChannel = supabase.channel('receptionist_appointments')...
const patientsChannel = supabase.channel('receptionist_patients')...
const visitsChannel = supabase.channel('receptionist_visits')...
const rolesChannel = supabase.channel('receptionist_roles')...

// REPLACE WITH:
const refreshInterval = setInterval(() => {
  fetchData();
}, 30000); // Refresh every 30 seconds

return () => clearInterval(refreshInterval);
```

### 2. fetchData() Function - Appointments
```typescript
// REMOVE:
const { data: appointmentsBasic, error: appointmentsError } = await supabase
  .from('appointments')
  .select(`*, patient:patients(...), department:departments(...)`)
  .order('appointment_time', { ascending: true });

// REPLACE WITH:
const appointmentsResponse = await api.get('/appointments?include=patient,department');
const appointmentsBasic = appointmentsResponse.data;
```

### 3. fetchData() - Doctors/Profiles
```typescript
// REMOVE:
const { data: doctorsData, error: doctorsError } = await supabase
  .from('profiles')
  .select('id, full_name')
  .in('id', doctorIds);

// REPLACE WITH:
const doctorsResponse = await api.get(`/profiles?ids=${doctorIds.join(',')}`);
const doctorsData = doctorsResponse.data;
```

### 4. fetchData() - Patients
```typescript
// REMOVE:
const { data: patientsData, error: patientsError } = await supabase
  .from('patients')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(10);

// REPLACE WITH:
const patientsResponse = await api.get('/patients?limit=10&sort=created_at&order=desc');
const patientsData = patientsResponse.data;
```

### 5. fetchData() - Departments
```typescript
// REMOVE:
const { data: departmentsData, error: departmentsError } = await supabase
  .from('departments')
  .select('*')
  .order('name');

// REPLACE WITH:
const departmentsResponse = await api.get('/departments?sort=name');
const departmentsData = departmentsResponse.data;
```

### 6. fetchData() - User Roles (Doctors)
```typescript
// REMOVE:
const { data: doctorRoles, error: rolesError } = await supabase
  .from('user_roles')
  .select('user_id')
  .eq('role', 'doctor');

// REPLACE WITH:
const rolesResponse = await api.get('/user-roles?role=doctor');
const doctorRoles = rolesResponse.data;
```

### 7. fetchData() - Patient Visits
```typescript
// REMOVE:
const { data: patientVisits, error: visitsError } = await supabase
  .from('patient_visits')
  .select('*')
  .eq('overall_status', 'Active');

// REPLACE WITH:
const visitsResponse = await api.get('/visits?overall_status=Active');
const patientVisits = visitsResponse.data;
```

### 8. fetchConsultationFee() - System Settings
```typescript
// REMOVE:
const { data, error } = await supabase
  .from('system_settings')
  .select('value')
  .eq('key', 'consultation_fee')
  .single();

// REPLACE WITH:
const response = await api.get('/system-settings/consultation_fee');
const consultationFee = response.data.value;
```

### 9. fetchConsultationFee() - Department Fees
```typescript
// REMOVE:
const { data: deptFeesData, error: deptError } = await supabase
  .from('department_fees')
  .select('department_id, fee_amount');

// REPLACE WITH:
const feesResponse = await api.get('/department-fees');
const deptFeesData = feesResponse.data;
```

### 10. handlePaymentSubmit() - Insert Payment
```typescript
// REMOVE:
const { error: paymentError } = await supabase
  .from('payments')
  .insert({...});

// REPLACE WITH:
await api.post('/payments', {...});
```

### 11. handleCheckIn() - Get Appointment
```typescript
// REMOVE:
const { data: appointment, error: appointmentFetchError } = await supabase
  .from('appointments')
  .select('patient_id')
  .eq('id', appointmentId)
  .single();

// REPLACE WITH:
const appointmentResponse = await api.get(`/appointments/${appointmentId}`);
const appointment = appointmentResponse.data;
```

### 12. handleCheckIn() - Update Appointment
```typescript
// REMOVE:
const { error: appointmentError } = await supabase
  .from('appointments')
  .update({ status: 'Confirmed', updated_at: new Date().toISOString() })
  .eq('id', appointmentId);

// REPLACE WITH:
await api.put(`/appointments/${appointmentId}`, {
  status: 'Confirmed',
  updated_at: new Date().toISOString()
});
```

### 13. handleCheckIn() - Get Existing Visit
```typescript
// REMOVE:
const { data: existingVisit } = await supabase
  .from('patient_visits')
  .select('id')
  .eq('appointment_id', appointmentId)
  .maybeSingle();

// REPLACE WITH:
const visitResponse = await api.get(`/visits?appointment_id=${appointmentId}&limit=1`);
const existingVisit = visitResponse.data[0] || null;
```

### 14. handleCheckIn() - Update Visit
```typescript
// REMOVE:
const { error: visitError } = await supabase
  .from('patient_visits')
  .update({...})
  .eq('id', existingVisit.id);

// REPLACE WITH:
await api.put(`/visits/${existingVisit.id}`, {...});
```

### 15. handleCheckIn() - Insert Visit
```typescript
// REMOVE:
const { error: visitError } = await supabase
  .from('patient_visits')
  .insert({...});

// REPLACE WITH:
await api.post('/visits', {...});
```

### 16. handleCancelAppointment() - Update Appointment
```typescript
// REMOVE:
const { error: appointmentError } = await supabase
  .from('appointments')
  .update({ status: 'Cancelled' })
  .eq('id', appointmentId);

// REPLACE WITH:
await api.put(`/appointments/${appointmentId}`, { status: 'Cancelled' });
```

### 17. handleCancelAppointment() - Update Visit
```typescript
// REMOVE:
const { error: visitError } = await supabase
  .from('patient_visits')
  .update({...})
  .eq('appointment_id', appointmentId);

// REPLACE WITH:
const visitResponse = await api.get(`/visits?appointment_id=${appointmentId}`);
if (visitResponse.data[0]) {
  await api.put(`/visits/${visitResponse.data[0].id}`, {...});
}
```

### 18. Returning Patient Search
```typescript
// REMOVE:
const { data, error } = await supabase
  .from('patients')
  .select('*')
  .or(`full_name.ilike.%${returningPatientSearch}%,phone.ilike.%${returningPatientSearch}%`)
  .limit(10);

// REPLACE WITH:
const response = await api.get(`/patients/search?q=${encodeURIComponent(returningPatientSearch)}&limit=10`);
const data = response.data;
```

### 19. createVisitForReturningPatient() - Check Existing Visits
```typescript
// REMOVE:
const { data: existingVisits, error: checkError } = await supabase
  .from('patient_visits')
  .select('*')
  .eq('patient_id', patient.id)
  .eq('overall_status', 'Active')
  .limit(1);

// REPLACE WITH:
const visitsResponse = await api.get(`/visits?patient_id=${patient.id}&overall_status=Active&limit=1`);
const existingVisits = visitsResponse.data;
```

### 20. createVisitForReturningPatient() - Insert Visit
```typescript
// REMOVE:
const { data: newVisit, error: visitError } = await supabase
  .from('patient_visits')
  .insert([visitData])
  .select()
  .single();

// REPLACE WITH:
const response = await api.post('/visits', visitData);
const newVisit = response.data;
```

### 21. searchPatients()
```typescript
// REMOVE:
const { data, error } = await supabase
  .from('patients')
  .select('*')
  .or(`full_name.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`)
  .limit(20);

// REPLACE WITH:
const response = await api.get(`/patients/search?q=${encodeURIComponent(searchQuery)}&limit=20`);
const data = response.data;
```

### 22. submitPatientRegistration() - Insert Patient
```typescript
// REMOVE:
const { data: newPatient, error: patientError } = await supabase
  .from('patients')
  .insert({...})
  .select()
  .single();

// REPLACE WITH:
const response = await api.post('/patients', {...});
const newPatient = response.data;
```

### 23. submitPatientRegistration() - Insert Visit
```typescript
// REMOVE:
const { error: visitError } = await supabase
  .from('patient_visits')
  .insert({...});

// REPLACE WITH:
await api.post('/visits', {...});
```

### 24. submitAppointmentBooking() - Insert Appointment
```typescript
// REMOVE:
const { data: newAppointment, error: appointmentError } = await supabase
  .from('appointments')
  .insert({...})
  .select()
  .single();

// REPLACE WITH:
const response = await api.post('/appointments', {...});
const newAppointment = response.data;
```

### 25. submitAppointmentBooking() - Insert Visit
```typescript
// REMOVE:
const { error: visitError } = await supabase
  .from('patient_visits')
  .insert({...});

// REPLACE WITH:
await api.post('/visits', {...});
```

## Required Backend Endpoints

All these endpoints must exist in your backend:

- `GET /appointments?include=patient,department`
- `GET /appointments/:id`
- `PUT /appointments/:id`
- `POST /appointments`
- `GET /patients?limit=&sort=&order=`
- `GET /patients/search?q=&limit=`
- `POST /patients`
- `GET /departments?sort=`
- `GET /profiles?ids=`
- `GET /user-roles?role=`
- `GET /visits?patient_id=&overall_status=&appointment_id=&limit=`
- `POST /visits`
- `PUT /visits/:id`
- `GET /system-settings/:key`
- `GET /department-fees`
- `POST /payments`

## Estimated Time
- Reading and understanding: 30 minutes
- Implementing changes: 2-3 hours
- Testing: 1 hour
- **Total: 3-4 hours**

## Next Steps
1. Ensure all backend endpoints exist
2. Replace each Supabase call systematically
3. Test each function after replacement
4. Verify no runtime errors
