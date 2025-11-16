# Dashboard Migration Plan - Supabase to MySQL API

## Status: In Progress

### Backend Endpoints Available ✅
- `/api/auth/*` - Authentication (login, register, me)
- `/api/users/*` - User management (CRUD)
- `/api/patients/*` - Patient management (CRUD)
- `/api/appointments/*` - Appointment management (CRUD)
- `/api/prescriptions/*` - Prescription management
- `/api/labs/*` - Lab test management
- `/api/pharmacy/*` - Pharmacy operations
- `/api/billing/*` - Billing and invoices
- `/api/visits/*` - Patient visits
- `/api/activity/*` - Activity logs
- `/api/upload/*` - File uploads

### Migration Priority

#### ✅ COMPLETED
1. **MedicalServicesDashboard.tsx** - 0 Supabase calls (DONE)
2. **AdminDashboard.tsx** - Core functions migrated (user/patient management)
3. **AuthContext.tsx** - Fully migrated to MySQL
4. **ActivityLogsView.tsx** - Fully migrated to MySQL

#### 🔄 HIGH PRIORITY (Critical User Flows)
1. **ReceptionistDashboard.tsx** - 38 calls
   - Appointment booking/management
   - Patient check-in
   - Queue management
   
2. **DoctorDashboard.tsx** - 23 calls
   - View appointments
   - Consultations
   - Prescriptions
   - Lab orders

3. **PatientDashboard.tsx** - 4 calls
   - View appointments
   - Medical records
   - Prescriptions

#### 🟡 MEDIUM PRIORITY
4. **BillingDashboard.tsx** - 23 calls
   - Invoice management
   - Payment processing
   
5. **PharmacyDashboard.tsx** - 17 calls
   - Prescription fulfillment
   - Inventory management

6. **LabDashboard.tsx** - 10 calls
   - Lab test orders
   - Results entry

7. **NurseDashboard.tsx** - 7 calls
   - Vitals recording
   - Patient monitoring

#### 🟢 LOW PRIORITY
8. **DebugDashboard.tsx** - 7 calls (Development only)
9. **DischargeDashboard.tsx** - 5 calls
10. **AdminDashboard.tsx** - 25 calls (Remaining features)

### Migration Strategy

#### For Each Dashboard:
1. **Identify Supabase Calls**
   - `supabase.from().select()`
   - `supabase.from().insert()`
   - `supabase.from().update()`
   - `supabase.from().delete()`
   - `supabase.auth.*`
   - `supabase.rpc()`

2. **Map to MySQL API Endpoints**
   - GET requests → `api.get()`
   - POST requests → `api.post()`
   - PUT requests → `api.put()`
   - DELETE requests → `api.delete()`

3. **Handle Response Format Changes**
   - Supabase: `{ data, error }`
   - MySQL API: `{ data }` or throws error

4. **Update Error Handling**
   - Use try/catch blocks
   - Handle `error.response?.data?.error`

5. **Test Functionality**
   - Verify data loads correctly
   - Test CRUD operations
   - Check error messages

### Common Patterns

#### Supabase Pattern:
```typescript
const { data, error } = await supabase
  .from('appointments')
  .select('*')
  .eq('doctor_id', doctorId);

if (error) throw error;
setAppointments(data);
```

#### MySQL API Pattern:
```typescript
const { data } = await api.get('/appointments', {
  params: { doctor_id: doctorId }
});
setAppointments(data.appointments);
```

### Testing Checklist

For each migrated dashboard:
- [ ] Page loads without errors
- [ ] Data displays correctly
- [ ] Create operations work
- [ ] Update operations work
- [ ] Delete operations work
- [ ] Error messages are user-friendly
- [ ] Loading states work
- [ ] No console errors

### Notes

- Some features may not have backend endpoints yet (medical services, departments, settings)
- These will show "Available soon" messages
- Real-time updates via Socket.io are available but optional
- All dashboards should gracefully handle missing data

