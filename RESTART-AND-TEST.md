# Restart Backend and Test - Quick Guide

## ✅ Backend Fix Applied!

The `/api/visits` endpoint now properly filters by query parameters.

---

## 🚀 Restart Backend

### Option 1: If using php artisan serve
```bash
# Stop current server (Ctrl+C)
cd backend
php artisan serve
```

### Option 2: If using Laravel Sail
```bash
cd backend
./vendor/bin/sail restart
```

### Option 3: If using other setup
Restart your Laravel backend server however you normally do it.

---

## 🧪 Test the Fix

### Test 1: Reception → Nurse Flow

1. **Go to Reception Dashboard**
2. **Register a new walk-in patient:**
   - Click "Register Walk-in Patient"
   - Fill in patient details
   - Submit
3. **Check console for:**
   ```
   🏥 Reception - Creating walk-in visit: {
     current_stage: "nurse",
     nurse_status: "Pending",
     ...
   }
   ✅ Walk-in visit created: {...}
   ```

4. **Go to Nurse Dashboard**
5. **Patient should now appear!** ✅
6. **Check console for:**
   ```
   👥 Nurse Dashboard - Visits fetched: {
     totalFromAPI: 1,
     afterFilter: 1,
     filtered: 0,
     visits: [{patient: "New Patient", ...}]
   }
   ```

### Test 2: Check-in Appointment

1. **Go to Reception Dashboard**
2. **Check-in an appointment:**
   - Find pending appointment
   - Click "Check In"
3. **Check console for:**
   ```
   🏥 Reception - Creating visit: {...}
   ✅ Visit created: {...}
   ```

4. **Go to Nurse Dashboard**
5. **Patient should appear!** ✅

### Test 3: Complete Workflow

1. **Reception:** Register patient → Nurse queue
2. **Nurse:** Record vitals → Doctor queue
3. **Doctor:** Start consultation → Order lab test → Lab queue
4. **Lab:** Process test → Doctor queue
5. **Doctor:** Review results → Write prescription → Pharmacy queue
6. **Pharmacy:** Dispense → Billing queue
7. **Billing:** Process payment → Discharged

**All transitions should work smoothly!** ✅

---

## 📊 Expected Console Output

### Reception (After registering):
```
🏥 Reception - Creating visit: {
  patient_id: "xxx",
  current_stage: "nurse",
  nurse_status: "Pending",
  overall_status: "Active"
}
✅ Visit created: {
  id: "xxx",
  current_stage: "nurse",
  nurse_status: "Pending"
}
```

### Nurse (After refresh):
```
👥 Nurse Dashboard - Visits fetched: {
  totalFromAPI: 1,      ← Backend returned 1 visit
  afterFilter: 1,       ← Frontend kept 1 visit
  filtered: 0,          ← 0 filtered out
  visits: [
    {
      id: "xxx",
      patient: "New Patient",
      current_stage: "nurse",
      nurse_status: "Pending"
    }
  ]
}
```

---

## ✅ Success Criteria

### Backend Working:
- [ ] Backend restarted successfully
- [ ] No errors in backend logs
- [ ] API responding to requests

### Reception → Nurse:
- [ ] Can register new patient
- [ ] Console shows visit creation logs
- [ ] Visit created with correct status
- [ ] Patient appears in Nurse Dashboard
- [ ] Nurse queue count updates

### Complete Workflow:
- [ ] Nurse → Doctor works
- [ ] Doctor → Lab works
- [ ] Lab → Doctor works
- [ ] Doctor → Pharmacy works
- [ ] Pharmacy → Billing works
- [ ] Billing → Discharge works

---

## 🐛 If Still Not Working

### Check 1: Backend Restarted?
```bash
# Make sure backend is running with new code
ps aux | grep php
# Should show php artisan serve process
```

### Check 2: Cache Cleared?
```bash
cd backend
php artisan config:clear
php artisan cache:clear
php artisan route:clear
```

### Check 3: Database Connection?
```bash
cd backend
php artisan tinker
>>> \App\Models\PatientVisit::count()
# Should return number of visits
```

### Check 4: API Responding?
```bash
curl http://localhost:8000/api/visits?current_stage=nurse
# Should return filtered results
```

---

## 📝 Quick Checklist

- [ ] Backend code updated
- [ ] Backend server restarted
- [ ] Frontend refreshed (Ctrl+R)
- [ ] Test patient registration
- [ ] Check console logs
- [ ] Verify patient appears in Nurse
- [ ] Test complete workflow

---

## 🎉 Expected Result

After restarting backend:
- ✅ Reception → Nurse: WORKING
- ✅ All workflow transitions: WORKING
- ✅ Queues update correctly: WORKING
- ✅ No ghost patients: WORKING

---

**Status:** ✅ Backend fix applied
**Next Step:** Restart backend server
**Expected:** Complete workflow now functional!

```bash
cd backend
php artisan serve
```

Then test the Reception → Nurse flow! 🚀
