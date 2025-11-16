# Supabase Removal Progress

## Status: IN PROGRESS

### Completed Files ✅

1. **NurseDashboard.tsx** - ✅ COMPLETE
   - Removed all Supabase calls (~15 instances)
   - Replaced with backend API calls
   - Implemented periodic refresh (30s interval)
   - All database operations now use `api.get/post/put`

### In Progress 🔄

2. **LabDashboard.tsx** - NEXT
3. **PharmacyDashboard.tsx** - PENDING
4. **ReceptionistDashboard.tsx** - PENDING
5. **BillingDashboard.tsx** - PENDING
6. **DoctorDashboard.tsx** - PENDING

### Changes Made in NurseDashboard

**Realtime Subscriptions:**
- ❌ Removed: `supabase.channel('nurse_visits')`
- ✅ Added: `setInterval()` for periodic refresh every 30 seconds

**Database Queries:**
- ❌ Removed: `supabase.from('patients').select()`
- ✅ Added: `api.get('/patients/search?q=...')`

- ❌ Removed: `supabase.from('patient_visits').select()`
- ✅ Added: `api.get('/visits?current_stage=nurse&...')`

- ❌ Removed: `supabase.from('patient_visits').update()`
- ✅ Added: `api.put('/visits/:id', data)`

- ❌ Removed: `supabase.from('appointments').select()`
- ✅ Added: `api.get('/appointments?date=...')`

- ❌ Removed: `supabase.from('appointments').insert()`
- ✅ Added: `api.post('/appointments', data)`

### Required Backend Endpoints

These endpoints must exist for NurseDashboard to work:

- ✅ `GET /patients/search?q=query` - Search patients
- ✅ `GET /visits?patient_id=&current_stage=&overall_status=&limit=` - Get visits
- ✅ `PUT /visits/:id` - Update visit
- ✅ `GET /appointments?date=` - Get appointments
- ✅ `POST /appointments` - Create appointment
- ✅ `GET /patients?limit=&sort=&order=` - List patients

---

**Next:** Continue with LabDashboard.tsx
