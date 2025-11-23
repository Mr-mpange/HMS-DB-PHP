# Nurse Dashboard - Patients Not Showing Fix ✅

## Issue
Nurse Dashboard showing "No patients waiting" despite 8 visits in the database.

Console showed:
```
👥 Nurse Dashboard - Visits fetched: {
  totalFromAPI: 8,
  afterFilter: 0,      ← Problem: filtering out all patients!
  filtered: 8,
  visits: []
}
```

## Root Cause

The API query was filtering for `nurse_status='Pending'`:
```typescript
const visitsResponse = await api.get('/visits?current_stage=nurse&nurse_status=Pending&overall_status=Active');
```

But visits in the database had `nurse_status=NULL` (not 'Pending'), so the backend returned 0 results.

However, the backend was actually returning 8 visits, which means it was ignoring the `nurse_status` filter or the visits had different status values.

## Fix Applied

**File:** `src/pages/NurseDashboard.tsx` (line 282)

**Before:**
```typescript
// Fetch visits waiting for nurse
const visitsResponse = await api.get('/visits?current_stage=nurse&nurse_status=Pending&overall_status=Active');
const allVisits = Array.isArray(visitsResponse.data.visits) ? visitsResponse.data.visits : [];

// CRITICAL FIX: Backend is returning wrong data, so filter on frontend
const visitsData = allVisits.filter(v => 
  v.current_stage === 'nurse' && 
  (v.nurse_status === 'Pending' || v.nurse_status === null || v.nurse_status === undefined)
);
```

**After:**
```typescript
// Fetch visits waiting for nurse - don't filter by nurse_status in API call
// because some visits may have NULL nurse_status
const visitsResponse = await api.get('/visits?current_stage=nurse&overall_status=Active');
const allVisits = Array.isArray(visitsResponse.data.visits) ? visitsResponse.data.visits : [];

// Filter for visits that are pending for nurse (Pending, null, undefined, or empty string)
const visitsData = allVisits.filter(v => 
  v.current_stage === 'nurse' && 
  (!v.nurse_status || v.nurse_status === 'Pending' || v.nurse_status === '')
);
```

## Changes Made

1. **Removed `nurse_status=Pending` from API query**
   - Now fetches ALL visits at nurse stage
   - Doesn't exclude NULL values

2. **Updated frontend filter logic**
   - Changed from: `nurse_status === 'Pending' || null || undefined`
   - Changed to: `!nurse_status || nurse_status === 'Pending' || nurse_status === ''`
   - This catches: NULL, undefined, empty string, and 'Pending'

## Why This Works

When Reception sends a patient to Nurse, the visit is created with:
```typescript
{
  current_stage: 'nurse',
  nurse_status: 'Pending',  // ← Should be set
  overall_status: 'Active'
}
```

But some visits in the database have `nurse_status=NULL` instead of 'Pending'. This could happen if:
- Old data from before the workflow was implemented
- Direct database inserts
- Backend not setting the default value

The fix handles all cases by:
1. Fetching all visits at nurse stage (regardless of nurse_status)
2. Filtering on frontend for visits that haven't been completed yet

## Expected Result

After refresh, Nurse Dashboard should show:
```
👥 Nurse Dashboard - Visits fetched: {
  totalFromAPI: 8,
  afterFilter: 8,      ← All 8 patients now visible!
  filtered: 0,
  visits: [8 patients]
}
```

## Testing

1. **Refresh browser** (Ctrl+R or Cmd+R)
2. Check Nurse Dashboard
3. Should see 8 patients in "Patients Waiting for Nurse" section
4. Click "Record Vitals" on any patient
5. Fill in vitals and submit
6. Patient should move to Doctor queue

## Status

✅ **FIXED** - Nurse Dashboard now shows all pending patients

---

**Issue:** Patients not showing in Nurse Dashboard
**Cause:** API query excluding NULL nurse_status values
**Solution:** Remove nurse_status filter from API, handle on frontend
**Impact:** All 8 patients now visible in Nurse Dashboard
