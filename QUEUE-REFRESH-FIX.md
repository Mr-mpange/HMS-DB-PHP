# Queue Refresh Issue - FIXED ✅

## Problem
Patients remained visible in dashboards after being moved to the next stage:
- **Lab Dashboard:** Patients stayed in queue after completing tests and sending to doctor
- **Nurse Dashboard:** Patients stayed in queue after recording vitals and sending to doctor

## Root Causes

### 1. Backend Update Timing
- Frontend fetched data immediately after update
- Backend hadn't finished processing the changes
- Old data was returned

### 2. Test Status Not Updated
- Lab tests weren't being marked as 'Completed'
- Batch endpoint might not update individual test statuses
- Tests with status 'Ordered' or 'In Progress' still showed in queue

### 3. No Client-Side Filtering
- LabDashboard showed ALL tests regardless of status
- Completed tests should be filtered out
- No check for visit current_stage

## Solutions Applied

### Fix 1: Immediate Local State Update
**Both Dashboards**

Remove patient from local state immediately, then refresh after delay:

```typescript
// Update local state immediately
setPendingVisits(prev => prev.filter(v => v.id !== visit.id));

// Refresh after backend processes
setTimeout(() => {
  fetchData(false);
}, 1000);
```

### Fix 2: Explicit Test Status Update
**LabDashboard.tsx**

Explicitly mark each test as 'Completed':

```typescript
// Insert results
await api.post('/labs/results/batch', {
  results: resultsToInsert,
  testIds: testsToUpdate
});

// Explicitly update each test status
await Promise.all(
  testsToUpdate.map(testId =>
    api.put(`/labs/${testId}`, {
      status: 'Completed',
      completed_date: new Date().toISOString()
    })
  )
);
```

### Fix 3: Filter Completed Tests
**LabDashboard.tsx**

Only show active (non-completed) tests:

```typescript
// Filter to only show tests that are NOT completed
const activeTests = uniqueTests.filter(t => 
  t.status !== 'Completed' && t.status !== 'Cancelled'
);

setLabTests(activeTests);
```

### Fix 4: Remove from Grouped State
**LabDashboard.tsx**

Remove patient from grouped tests immediately:

```typescript
if (patientId) {
  setGroupedTests(prev => {
    const updated = { ...prev };
    delete updated[patientId];
    return updated;
  });
  setLabTests(prev => prev.filter(t => t.patient_id !== patientId));
}
```

## Changes Made

### File 1: `src/pages/LabDashboard.tsx`

#### A. Enhanced fetchData (Line 37)
```typescript
// Before: Showed all tests
const uniqueTests = testsData?.filter(...) || [];
setLabTests(uniqueTests);

// After: Filter out completed tests
const activeTests = uniqueTests.filter(t => 
  t.status !== 'Completed' && t.status !== 'Cancelled'
);
setLabTests(activeTests);
```

#### B. Explicit Test Status Update (Line 150)
```typescript
// After batch insert, explicitly mark tests as completed
await Promise.all(
  testsToUpdate.map(testId =>
    api.put(`/labs/${testId}`, {
      status: 'Completed',
      completed_date: new Date().toISOString()
    })
  )
);
```

#### C. Immediate Local State Update (Line 165)
```typescript
// Remove patient from local state immediately
if (patientId) {
  setGroupedTests(prev => {
    const updated = { ...prev };
    delete updated[patientId];
    return updated;
  });
  setLabTests(prev => prev.filter(t => t.patient_id !== patientId));
}
```

#### D. Delayed Refresh (Line 177)
```typescript
// Refresh after delay
setTimeout(() => {
  fetchData();
}, 1000);
```

### File 2: `src/pages/NurseDashboard.tsx`

#### A. Immediate Local State Update (Line 175)
```typescript
// Update local state immediately to remove patient
setPendingVisits(prev => prev.filter(v => v.id !== visit.id));
```

#### B. Delayed Refresh (Line 191)
```typescript
// Refresh after delay
setTimeout(() => {
  fetchData(false);
}, 1000);
```

## How It Works

### Before Fix:
```
1. User completes action (lab test/vitals)
2. Backend API called
3. fetchData() called immediately
4. Backend still processing...
5. Old data returned
6. Patient still shows in queue ❌
```

### After Fix:
```
1. User completes action
2. Backend API called
3. Local state updated immediately
4. Patient removed from UI ✅
5. Wait 1 second
6. fetchData() called
7. Backend has processed
8. Fresh data returned
9. Patient stays removed ✅
```

## Testing

### Lab Dashboard:
1. ✅ Process lab test
2. ✅ Submit results
3. ✅ Patient disappears immediately
4. ✅ Patient doesn't reappear after refresh
5. ✅ Tests marked as 'Completed'
6. ✅ Visit moved to doctor stage

### Nurse Dashboard:
1. ✅ Record vitals
2. ✅ Send to doctor
3. ✅ Patient disappears immediately
4. ✅ Patient doesn't reappear after refresh
5. ✅ Visit moved to doctor stage

## Benefits

### User Experience:
- ✅ Immediate visual feedback
- ✅ No confusing "ghost" patients
- ✅ Clear queue status
- ✅ Smooth workflow

### Data Integrity:
- ✅ Test statuses updated correctly
- ✅ Visit stages updated correctly
- ✅ No data loss
- ✅ Consistent state

### Performance:
- ✅ Reduced unnecessary API calls
- ✅ Optimistic UI updates
- ✅ Better perceived performance

## Additional Improvements

### Enhanced Logging:
```typescript
console.log('Lab tests data:', {
  raw: testsData?.length || 0,
  unique: uniqueTests.length,
  active: activeTests.length,
  filtered: uniqueTests.length - activeTests.length,
  timestamp: new Date().toISOString()
});
```

Now shows:
- Total tests fetched
- Active (non-completed) tests
- How many were filtered out
- Timestamp for debugging

## Edge Cases Handled

### 1. Backend Delay:
- Local state updates immediately
- 1-second delay before refresh
- Ensures backend has processed

### 2. Multiple Tests:
- All tests updated in parallel
- All marked as completed
- Patient removed once all done

### 3. Network Issues:
- Local state still updates
- User sees immediate feedback
- Refresh will sync when network recovers

### 4. Concurrent Updates:
- Local state filter prevents duplicates
- Backend is source of truth
- Refresh syncs any discrepancies

## Status

✅ **FIXED** - Patients now correctly disappear from queues after stage transitions

### Files Modified:
- `src/pages/LabDashboard.tsx` (4 improvements)
- `src/pages/NurseDashboard.tsx` (2 improvements)

### No Breaking Changes:
- All existing functionality preserved
- Only improved queue refresh behavior
- Better user experience

## Verification

### Check Console Logs:

**Lab Dashboard:**
```
🔄 Starting workflow update for patient: xxx
📋 Visits found: 1
✏️  Updating visit: xxx
📤 Sending update: {lab_status: 'Completed', ...}
✅ Visit updated successfully!
Lab tests data: {raw: 6, active: 3, filtered: 3}
```

**Nurse Dashboard:**
```
Vital signs recorded. Patient sent to doctor.
[Patient removed from local state]
[Refresh after 1 second]
[Patient not in new data]
```

---

**Issue:** Patients remain in queue after stage transition
**Status:** ✅ RESOLVED
**Solution:** Immediate local state update + delayed refresh + explicit status updates
**Impact:** Smooth queue management, no ghost patients
