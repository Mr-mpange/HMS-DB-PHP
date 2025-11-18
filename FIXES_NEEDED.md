# System Issues and Fixes

## ✅ Issue 1: Date of Birth Validation
**Status**: ALREADY FIXED
- The registration form already has `max={new Date().toISOString().split('T')[0]}` 
- This prevents selecting future dates

## ✅ Issue 2: Quick Service 500 Error  
**Status**: FIXED
- Simplified QuickServiceDialog to remove walk-in registration
- Now only works with existing patients
- Fixed API endpoint to use `/api/patient-services`

## ⚠️ Issue 3: Nurse Schedule Showing 0
**Problem**: Nurse dashboard shows 0 appointments even when appointments exist
**Cause**: Same timezone issue - comparing dates in different formats
**Fix Needed**: Apply same date comparison fix as receptionist dashboard

## ⚠️ Issue 4: Missing Lab/Pharmacy Order Forms
**Problem**: No forms to order lab tests or pharmacy items during consultation
**Current State**: Doctor can only add notes, no service ordering
**Fix Needed**: 
- Add "Order Lab Tests" button in doctor consultation
- Add "Prescribe Medication" button in doctor consultation
- Create order forms for both

## ⚠️ Issue 5: Patient Count Always Shows 10
**Problem**: Display shows "10+" even when there are fewer patients
**Fix Needed**: Show exact count instead of "10+"

## ⚠️ Issue 6: Database Connection Crashes
**Problem**: Database connections timing out, need to restart
**Causes**:
1. No connection pooling limits
2. Queries not closing connections
3. Too many simultaneous connections
**Fix Needed**:
- Configure proper connection pool limits
- Add connection timeout handling
- Implement query optimization

## ⚠️ Issue 7: Page Refresh "Shake"
**Problem**: Page visibly reloads/shakes when refreshing data
**Fix Needed**:
- Add loading skeletons instead of full page reload
- Implement optimistic UI updates
- Use React Query or SWR for smooth data fetching

## Issue 8: (Incomplete)
Waiting for full question...

---

## Priority Order:
1. Issue 3 (Nurse schedule) - Quick fix
2. Issue 4 (Lab/Pharmacy forms) - Important functionality
3. Issue 6 (Database crashes) - Critical for stability
4. Issue 7 (Page shake) - UX improvement
5. Issue 5 (Patient count) - Minor display issue
