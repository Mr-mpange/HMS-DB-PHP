# MySQL Migration Checklist

## ✅ Completed

- [x] Backend MySQL setup
- [x] API client created (`src/lib/api.ts`)
- [x] Socket.io client configured
- [x] Supabase stub files created (temporary fix)
- [x] Import errors resolved
- [x] Application can start

## ⚠️ In Progress - Frontend Migration

### Core System (Priority 1)
- [ ] **src/contexts/AuthContext.tsx** - Replace Supabase auth with JWT
  - [ ] signIn method
  - [ ] signUp method
  - [ ] signOut method
  - [ ] getSession method
  - [ ] onAuthStateChange listener

### Utilities (Priority 2)
- [ ] **src/lib/utils.ts** - Update logActivity function
- [ ] **src/lib/mobilePaymentService.ts** - Update payment logging

### Dashboard Pages (Priority 3)
- [ ] **src/pages/ReceptionistDashboard.tsx**
  - [ ] Patient registration
  - [ ] Appointment booking
  - [ ] Patient queue management
  - [ ] Real-time updates
  
- [ ] **src/pages/DoctorDashboard.tsx**
  - [ ] Patient queue
  - [ ] Consultation management
  - [ ] Prescription creation
  - [ ] Lab test ordering
  - [ ] Real-time updates

- [ ] **src/pages/NurseDashboard.tsx**
  - [ ] Vital signs recording
  - [ ] Patient triage
  - [ ] Real-time updates

- [ ] **src/pages/LabDashboard.tsx**
  - [ ] Lab test queue
  - [ ] Results entry
  - [ ] Real-time updates

- [ ] **src/pages/PharmacyDashboard.tsx**
  - [ ] Prescription queue
  - [ ] Medication dispensing
  - [ ] Real-time updates

- [ ] **src/pages/BillingDashboard.tsx**
  - [ ] Invoice management
  - [ ] Payment processing
  - [ ] Real-time updates

- [ ] **src/pages/AdminDashboard.tsx**
  - [ ] User management
  - [ ] Role assignment
  - [ ] System settings
  - [ ] Reports

### Other Pages (Priority 4)
- [ ] **src/pages/PatientDashboard.tsx**
- [ ] **src/pages/DischargeDashboard.tsx**
- [ ] **src/pages/MedicalServicesDashboard.tsx**
- [ ] **src/pages/PaymentSuccess.tsx**
- [ ] **src/pages/DebugDashboard.tsx**

### Components (Priority 5)
- [ ] **src/components/DashboardLayout.tsx**
- [ ] **src/components/AdminReports.tsx**
- [ ] **src/components/ActivityLogsView.tsx**
- [ ] **src/components/PaymentDialog.tsx**
- [ ] **src/components/MultiplePrescriptionDialog.tsx**
- [ ] **src/components/EnhancedPrescriptionDialog.tsx**
- [ ] **src/components/EnhancedDoctorFeatures.tsx**
- [ ] **src/components/EnhancedAppointmentBooking.tsx**

### Services (Priority 6)
- [ ] **src/services/medicalService.ts**

## 🧪 Testing Checklist

After each migration:
- [ ] Component loads without errors
- [ ] Data fetches correctly
- [ ] Create operations work
- [ ] Update operations work
- [ ] Delete operations work
- [ ] Real-time updates trigger
- [ ] Error handling works
- [ ] Loading states display

## 🚀 Deployment Checklist

Before deploying:
- [ ] All Supabase imports removed
- [ ] All stub warnings gone from console
- [ ] All features tested
- [ ] Backend API running
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Socket.io connections working

## 📝 Migration Steps for Each File

1. **Open the file**
2. **Replace import:**
   ```typescript
   // Remove:
   import { supabase } from '@/integrations/supabase/client';
   
   // Add:
   import api, { getSocket } from '@/lib/api';
   ```

3. **Update data fetching:**
   ```typescript
   // Before:
   const { data, error } = await supabase.from('table').select('*');
   
   // After:
   const { data } = await api.get('/endpoint');
   const items = data.items;
   ```

4. **Update real-time:**
   ```typescript
   // Before:
   const channel = supabase.channel('name').on(...).subscribe();
   
   // After:
   const socket = getSocket();
   socket.emit('subscribe', 'channel');
   socket.on('event', handler);
   ```

5. **Test the component**
6. **Move to next file**

## 🔍 Quick Find & Replace

Use these patterns to find code that needs updating:

### Find Supabase imports:
```
import.*supabase.*client
```

### Find Supabase queries:
```
supabase\.from\(
```

### Find Supabase channels:
```
supabase\.channel\(
```

### Find Supabase auth:
```
supabase\.auth\.
```

## 📊 Progress Tracking

- **Total files to migrate:** ~25
- **Files migrated:** 0
- **Completion:** 0%

Update this as you complete each file!

## 🆘 Need Help?

### Common Issues:

**Issue:** Data structure different from Supabase
**Solution:** Check backend API response format in `backend/controllers/`

**Issue:** Real-time not working
**Solution:** Ensure backend Socket.io is running and events match

**Issue:** Authentication fails
**Solution:** Check JWT token in localStorage and backend auth middleware

### Resources:
- Backend API docs: `backend/README.md`
- API client: `src/lib/api.ts`
- Migration guide: `SUPABASE_REMOVED_GUIDE.md`

---

**Last Updated:** November 15, 2025  
**Next Priority:** Migrate AuthContext.tsx
