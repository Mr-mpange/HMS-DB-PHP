# Fix: "Patients Waiting for Consultation" Shows Wrong Count

## Problem

The Doctor Dashboard shows "1 patient" waiting but the description says "Patients ready for doctor consultation (includes reviewed lab results)" which is confusing.

## Root Cause

The query in `DoctorDashboard.tsx` is using incorrect filters:

```typescript
// WRONG QUERY ❌
const visitsResponse = await api.get(
  `/visits?current_stage=doctor&overall_status=Active&doctor_status_neq=Completed`
);
```

This query:
- Gets visits where `current_stage=doctor` ✅
- AND `overall_status=Active` ✅  
- AND `doctor_status != Completed` ❌ (This is wrong!)

The problem: `doctor_status_neq=Completed` means "not equal to Completed", which includes:
- `Pending` (correct - should show)
- `In Progress` (correct - should show)
- `null` (wrong - shouldn't show)
- Any other value (wrong)

## Solution

Use the correct query:

```typescript
// CORRECT QUERY ✅
const visitsResponse = await api.get(
  `/visits?current_stage=doctor&overall_status=Active&doctor_status=Pending`
);
```

Or if you want to include "In Progress" patients:

```typescript
// INCLUDE IN PROGRESS ✅
const visitsResponse = await api.get(
  `/visits?current_stage=doctor&overall_status=Active&doctor_status_in=Pending,In Progress`
);
```

## Implementation

### File: `src/pages/DoctorDashboard.tsx`

Find this line (around line 1577):

```typescript
const visitsResponse = await fetchWithCache(
  `doctor_visits_${user.id}`,
  () => api.get(`/visits?current_stage=doctor&overall_status=Active&doctor_status_neq=Completed`),
  { cacheTime: 30000, staleTime: 15000 }
);
```

Replace with:

```typescript
const visitsResponse = await fetchWithCache(
  `doctor_visits_${user.id}`,
  () => api.get(`/visits?current_stage=doctor&overall_status=Active&doctor_status=Pending`),
  { cacheTime: 30000, staleTime: 15000 }
);
```

## Expected Behavior After Fix

### Before Fix ❌
- Shows: "1 patient waiting"
- Actually: Includes patients with null status, completed patients, etc.
- Confusing and inaccurate

### After Fix ✅
- Shows: "X patients waiting" (accurate count)
- Only includes: Patients with `doctor_status=Pending`
- Clear and accurate

## Additional Improvements

### 1. Update the Card Description

Make it clearer what "waiting" means:

```typescript
<CardDescription>
  Patients in queue waiting for consultation
</CardDescription>
```

### 2. Add Status Breakdown

Show more detail:

```typescript
<CardDescription>
  {pendingCount} pending, {inProgressCount} in progress
</CardDescription>
```

### 3. Filter by Doctor ID

If you want to show only patients assigned to this specific doctor:

```typescript
const visitsResponse = await api.get(
  `/visits?current_stage=doctor&doctor_id=${user.id}&doctor_status=Pending`
);
```

## Testing

1. **Create Test Data:**
   - Check in a patient (Reception)
   - Record vitals (Nurse)
   - Patient moves to doctor queue

2. **Check Doctor Dashboard:**
   - Should show "1 patient waiting"
   - Click to view patient details
   - Patient should be in "Pending" status

3. **Start Consultation:**
   - Click "Start Consultation"
   - Status changes to "In Progress"
   - Count updates accordingly

4. **Complete Consultation:**
   - Click "Complete"
   - Patient removed from queue
   - Count decreases

## Summary

**Issue:** Wrong query filter causing incorrect patient count  
**Fix:** Use `doctor_status=Pending` instead of `doctor_status_neq=Completed`  
**Impact:** Accurate patient queue count  
**Time to Fix:** 2 minutes  

**Status:** ✅ Ready to implement
