# Lab Dashboard - Tests Not Showing

## Current Status

**Backend Data:**
- ✅ 8 pending lab tests in database
- ✅ 4 visits at lab stage
- ✅ API endpoint `/labs` returns data with patient relationships
- ✅ All tests have status 'Pending' (not Completed/Cancelled)

**Frontend:**
- ❌ Lab Dashboard shows "No pending lab tests"
- ❌ Stats show: Pending: 0, In Progress: 0, Completed: 0

## Debugging Steps

### Step 1: Check Browser Console

Open Lab Dashboard and check console for:
```
Lab tests data: {
  raw: ?,
  unique: ?,
  active: ?,
  filtered: ?,
  sample: [...]
}
```

**Expected:** `raw: 8, active: 8`
**If showing:** `raw: 0` → API not returning data
**If showing:** `raw: 8, active: 0` → Frontend filtering issue

### Step 2: Check Network Tab

1. Open browser DevTools (F12)
2. Go to Network tab
3. Refresh Lab Dashboard
4. Look for request to `/api/labs`
5. Check response

**Expected response:**
```json
{
  "labTests": [
    {
      "id": "...",
      "test_name": "Complete Blood Count",
      "status": "Pending",
      "patient": {
        "id": "...",
        "full_name": "John Doe"
      }
    },
    ...
  ]
}
```

### Step 3: Check Authentication

The `/api/labs` endpoint might require authentication. Check if:
- Auth token is being sent in headers
- Token is valid
- User has permission to view lab tests

## Possible Issues

### Issue 1: API Route Not Registered

Check `backend/routes/api.php` for:
```php
Route::get('/labs', [LabTestController::class, 'index']);
```

### Issue 2: CORS Issue

If API is on different domain, check CORS headers.

### Issue 3: Frontend API Base URL

Check if `api.get('/labs')` is using correct base URL.

### Issue 4: Response Format Mismatch

Frontend expects `data.labTests` or `data.tests`, but backend might return different format.

## Quick Test

Run this in browser console on Lab Dashboard:
```javascript
// Test API directly
fetch('http://localhost:8000/api/labs', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('auth_token'),
    'Accept': 'application/json'
  }
})
.then(r => r.json())
.then(data => console.log('API Response:', data))
.catch(err => console.error('API Error:', err));
```

## Next Steps

1. **Check browser console** for the log message
2. **Check network tab** for API response
3. **Share the console output** so I can see what's happening
4. Based on the output, I'll provide the fix

---

**Status:** ⏳ Waiting for browser console output
