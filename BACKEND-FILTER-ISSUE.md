# Backend API Filter Issue - CRITICAL ⚠️

## Problem
Backend API endpoint `/visits` is NOT respecting query parameters for filtering.

### Expected Behavior:
```
GET /visits?current_stage=nurse&nurse_status=Pending&overall_status=Active
```
Should return ONLY visits where:
- `current_stage = 'nurse'` AND
- `nurse_status = 'Pending'` AND
- `overall_status = 'Active'`

### Actual Behavior:
Returns ALL visits regardless of query parameters, including:
- `current_stage = 'doctor'`
- `current_stage = 'lab'`
- `current_stage = null`
- `nurse_status = 'Completed'`
- `nurse_status = null`

## Evidence

### Console Output:
```
👥 Nurse Dashboard - Visits fetched: {total: 5, visits: Array(5)}

👤 Patient 1: {
  nurse_status: 'Completed',  ❌ Should be 'Pending'
  current_stage: 'doctor',    ❌ Should be 'nurse'
}

👤 Patient 2: {
  nurse_status: 'Completed',  ❌ Should be 'Pending'
  current_stage: 'lab',       ❌ Should be 'nurse'
}

👤 Patient 3: {
  nurse_status: 'Completed',  ❌ Should be 'Pending'
  current_stage: 'lab',       ❌ Should be 'nurse'
}

👤 Patient 4: {
  nurse_status: 'Completed',  ❌ Should be 'Pending'
  current_stage: 'lab',       ❌ Should be 'nurse'
}

👤 Patient 5: {
  nurse_status: null,         ❌ Should be 'Pending'
  current_stage: null,        ❌ Should be 'nurse'
}
```

**Result:** 0 out of 5 visits match the query criteria!

## Impact

### Affected Dashboards:
1. **Nurse Dashboard** - Shows wrong patients
2. **Doctor Dashboard** - Likely affected
3. **Lab Dashboard** - Likely affected
4. **Pharmacy Dashboard** - Likely affected
5. **Billing Dashboard** - Likely affected

### User Impact:
- Nurses see patients who are already in doctor/lab stage
- Cannot identify which patients actually need vitals
- Workflow confusion
- Data integrity issues

## Frontend Workaround Applied

### File: `src/pages/NurseDashboard.tsx`

Added client-side filtering:

```typescript
// Fetch from API (returns wrong data)
const visitsResponse = await api.get('/visits?current_stage=nurse&nurse_status=Pending&overall_status=Active');
const allVisits = visitsResponse.data.visits || [];

// WORKAROUND: Filter on frontend
const visitsData = allVisits.filter(v => 
  v.current_stage === 'nurse' && 
  (v.nurse_status === 'Pending' || v.nurse_status === null)
);
```

**Status:** ✅ Frontend workaround in place

## Backend Fix Required

### Location:
Backend API endpoint: `/api/visits`

### Issue:
Query parameter filtering not implemented or not working correctly.

### Required Fix:
```php
// Laravel example
$query = Visit::query();

if ($request->has('current_stage')) {
    $query->where('current_stage', $request->current_stage);
}

if ($request->has('nurse_status')) {
    $query->where('nurse_status', $request->nurse_status);
}

if ($request->has('overall_status')) {
    $query->where('overall_status', $request->overall_status);
}

$visits = $query->get();
```

### Test Query:
```sql
SELECT * FROM visits 
WHERE current_stage = 'nurse' 
AND nurse_status = 'Pending' 
AND overall_status = 'Active';
```

## Verification

### Before Fix:
```
GET /visits?current_stage=nurse&nurse_status=Pending
Returns: 5 visits (all wrong)
Correct: 0 visits
```

### After Fix:
```
GET /visits?current_stage=nurse&nurse_status=Pending
Returns: 0 visits (if no patients in nurse stage)
Returns: X visits (only those matching criteria)
```

## Other Affected Endpoints

Check these endpoints for similar issues:

1. `/visits?current_stage=doctor&doctor_status=Pending`
2. `/visits?current_stage=lab&lab_status=Pending`
3. `/visits?current_stage=pharmacy&pharmacy_status=Pending`
4. `/visits?current_stage=billing&billing_status=Pending`
5. `/labs?status=Ordered,Sample Collected,In Progress`
6. `/prescriptions?status=Pending`

## Temporary Solution

### For Each Dashboard:
Add frontend filtering after API call:

```typescript
const response = await api.get('/visits?current_stage=X&status=Y');
const allData = response.data.visits || [];

// Filter on frontend
const filteredData = allData.filter(v => 
  v.current_stage === 'X' && 
  v.status === 'Y'
);
```

## Priority

**CRITICAL** ⚠️

This affects core workflow functionality. Without proper filtering:
- Wrong patients shown in queues
- Workflow confusion
- Potential medical errors
- Data integrity issues

## Status

- ✅ Frontend workaround: APPLIED (Nurse Dashboard)
- ⏳ Backend fix: REQUIRED
- ⏳ Other dashboards: NEED WORKAROUND

## Recommendation

1. **Immediate:** Apply frontend workaround to all dashboards
2. **Short-term:** Fix backend API filtering
3. **Long-term:** Add API tests to prevent regression

---

**Issue:** Backend API not filtering by query parameters
**Impact:** CRITICAL - Affects all workflow dashboards
**Workaround:** ✅ Frontend filtering applied
**Permanent Fix:** ⏳ Backend API needs fixing
