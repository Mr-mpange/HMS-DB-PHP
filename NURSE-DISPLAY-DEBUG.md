# Nurse Dashboard Display Issue - Debugging

## Problem
Nurse Dashboard shows:
- Stats: "Pending Vitals: 4"
- Display: "No patients waiting"

This indicates data is fetched but not displayed.

## Debugging Added

### Log 1: Data Fetching
**Location:** After API call (Line 283)

```typescript
console.log('👥 Nurse Dashboard - Visits fetched:', {
  total: visitsData.length,
  visits: visitsData.map(v => ({
    id: v.id,
    patient: v.patient?.full_name,
    current_stage: v.current_stage,
    nurse_status: v.nurse_status,
    overall_status: v.overall_status
  }))
});
```

**Shows:**
- How many visits were fetched
- Each visit's status fields
- Patient names

### Log 2: Display Filter
**Location:** In render (Line 430)

```typescript
console.log('🔍 Nurse Dashboard - Display filter:', {
  totalPending: pendingVisits.length,
  afterFilter: filteredVisits.length,
  filtered: pendingVisits.map(v => ({
    patient: v.patient?.full_name,
    nurse_status: v.nurse_status,
    current_stage: v.current_stage,
    passes: v.nurse_status === 'Pending' && v.current_stage === 'nurse'
  }))
});
```

**Shows:**
- How many visits in state
- How many pass the filter
- Why each visit passes or fails

## Possible Causes

### Cause 1: Status Field Mismatch
**Symptom:** Visits have different status values

**Example:**
```javascript
// Expected
nurse_status: 'Pending'

// Actual (might be)
nurse_status: 'pending'  // lowercase
nurse_status: null
nurse_status: undefined
```

**Solution:** Make filter case-insensitive or handle null

### Cause 2: Stage Field Mismatch
**Symptom:** Visits have different stage values

**Example:**
```javascript
// Expected
current_stage: 'nurse'

// Actual (might be)
current_stage: 'Nurse'  // capitalized
current_stage: 'reception'  // wrong stage
```

**Solution:** Normalize stage values

### Cause 3: Data Not Loaded
**Symptom:** pendingVisits is empty array

**Check:**
- Is API call successful?
- Is response data structure correct?
- Is setPendingVisits being called?

### Cause 4: Filter Too Strict
**Symptom:** All visits filtered out

**Current filter:**
```typescript
visit.nurse_status === 'Pending' && 
visit.current_stage === 'nurse'
```

**Might need:**
```typescript
visit.nurse_status === 'Pending' || 
visit.current_stage === 'nurse'
```

## How to Use Logs

### Step 1: Open Console
Press F12 → Console tab

### Step 2: Reload Page
Refresh the Nurse Dashboard

### Step 3: Check Logs

**Look for:**
```
👥 Nurse Dashboard - Visits fetched: {total: 4, visits: [...]}
🔍 Nurse Dashboard - Display filter: {totalPending: 4, afterFilter: 0, ...}
```

### Step 4: Analyze

**If total: 4, afterFilter: 0:**
- Check the `filtered` array
- See which fields don't match
- See `passes: false` reasons

**If total: 0:**
- API not returning data
- Check backend
- Check query parameters

## Expected Console Output

### Scenario 1: Working Correctly
```javascript
👥 Nurse Dashboard - Visits fetched: {
  total: 4,
  visits: [
    {
      id: "xxx",
      patient: "John Doe",
      current_stage: "nurse",
      nurse_status: "Pending",
      overall_status: "Active"
    },
    // ... 3 more
  ]
}

🔍 Nurse Dashboard - Display filter: {
  totalPending: 4,
  afterFilter: 4,
  filtered: [
    {
      patient: "John Doe",
      nurse_status: "Pending",
      current_stage: "nurse",
      passes: true  ✅
    },
    // ... 3 more with passes: true
  ]
}
```

### Scenario 2: Status Mismatch
```javascript
👥 Nurse Dashboard - Visits fetched: {
  total: 4,
  visits: [...]
}

🔍 Nurse Dashboard - Display filter: {
  totalPending: 4,
  afterFilter: 0,  ❌
  filtered: [
    {
      patient: "John Doe",
      nurse_status: "pending",  ❌ lowercase
      current_stage: "nurse",
      passes: false  ❌
    },
    // ... all with passes: false
  ]
}
```

### Scenario 3: Stage Mismatch
```javascript
🔍 Nurse Dashboard - Display filter: {
  totalPending: 4,
  afterFilter: 0,  ❌
  filtered: [
    {
      patient: "John Doe",
      nurse_status: "Pending",
      current_stage: "reception",  ❌ wrong stage
      passes: false  ❌
    }
  ]
}
```

## Quick Fixes

### Fix 1: Case-Insensitive Filter
```typescript
.filter(visit => 
  visit.nurse_status?.toLowerCase() === 'pending' && 
  visit.current_stage?.toLowerCase() === 'nurse'
)
```

### Fix 2: Null-Safe Filter
```typescript
.filter(visit => 
  (visit.nurse_status === 'Pending' || !visit.nurse_status) && 
  visit.current_stage === 'nurse'
)
```

### Fix 3: Remove Filter Temporarily
```typescript
// Test without filter
{pendingVisits.map((visit) => (...))}
```

## Next Steps

1. ✅ Check console logs
2. ✅ Identify which scenario matches
3. ✅ Apply appropriate fix
4. ✅ Test again

## Status

⏳ **DEBUGGING** - Logs added, waiting for console output

**Files Modified:**
- `src/pages/NurseDashboard.tsx` (2 log points added)

**Next Action:** Check browser console for diagnostic output
