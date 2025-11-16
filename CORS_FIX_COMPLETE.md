# ✅ CORS Issue Fixed

## Problem

The frontend was getting a CORS error:
```
Access to XMLHttpRequest at 'http://localhost:3000/api/auth/login' 
from origin 'http://localhost:8081' has been blocked by CORS policy
```

This happened because:
- Backend was configured to only allow `http://localhost:5173`
- Frontend was running on `http://localhost:8081`
- CORS policy blocked the cross-origin request

## Solution Applied

Updated `backend/src/server.js` to allow multiple frontend origins:

### Before
```javascript
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
```

### After
```javascript
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:8081',
  'http://localhost:3000',
  'http://localhost:5174',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
```

## What Changed

1. **Multiple Origins Supported**
   - `http://localhost:5173` - Default Vite port
   - `http://localhost:8081` - Your current frontend port
   - `http://localhost:3000` - Backend port (for testing)
   - `http://localhost:5174` - Alternative Vite port
   - Custom origin from `FRONTEND_URL` env variable

2. **Socket.io CORS Updated**
   - Also configured to accept multiple origins
   - Ensures real-time features work from any allowed origin

3. **Dynamic Origin Checking**
   - Validates origin against allowed list
   - Logs blocked origins for debugging
   - Allows requests with no origin (curl, mobile apps)

## Backend Restarted

✅ Backend server has been restarted with new CORS configuration
✅ Server running on: http://localhost:3000
✅ Database connected successfully

## Testing

### 1. Test CORS is Working

Open your browser console and try:
```javascript
fetch('http://localhost:3000/api/health')
  .then(r => r.json())
  .then(console.log)
```

Expected: No CORS error, returns health status

### 2. Test Login

1. Open frontend: `http://localhost:8081`
2. Login with: `admin@hospital.com` / `admin123`
3. Check browser console - should see no CORS errors
4. Should successfully login and redirect

### 3. Verify in Network Tab

1. Open DevTools → Network tab
2. Try to login
3. Look at the login request
4. Response Headers should include:
   ```
   Access-Control-Allow-Origin: http://localhost:8081
   Access-Control-Allow-Credentials: true
   ```

## Environment Variables

### Backend `.env`
```env
# Optional: Set custom frontend URL
FRONTEND_URL=http://localhost:8081
```

### Frontend `.env`
```env
# Already configured correctly
VITE_API_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000
```

## Adding More Origins

If you need to add more allowed origins (e.g., production URL):

1. **Edit `backend/src/server.js`:**
   ```javascript
   const allowedOrigins = [
     'http://localhost:5173',
     'http://localhost:8081',
     'https://your-production-domain.com',  // Add here
     process.env.FRONTEND_URL
   ].filter(Boolean);
   ```

2. **Or use environment variable:**
   ```env
   FRONTEND_URL=https://your-production-domain.com
   ```

3. **Restart backend:**
   ```bash
   cd backend
   node src/server.js
   ```

## Common CORS Issues

### Issue: Still getting CORS error
**Solution:**
1. Make sure backend is restarted
2. Clear browser cache
3. Check frontend is using correct API URL in `.env`
4. Verify origin in browser DevTools → Network → Request Headers

### Issue: CORS works but credentials not sent
**Solution:**
- Ensure `credentials: true` in both frontend and backend
- Frontend axios should have `withCredentials: true` (already configured in `src/lib/api.ts`)

### Issue: Preflight request failing
**Solution:**
- Backend must respond to OPTIONS requests
- Express CORS middleware handles this automatically
- Check backend logs for blocked origins

### Issue: Different port each time
**Solution:**
- Vite assigns random port if default is busy
- Add all common ports to `allowedOrigins` array
- Or specify port in `package.json`:
  ```json
  "scripts": {
    "dev": "vite --port 5173"
  }
  ```

## Security Notes

### Development
- Multiple localhost origins are fine for development
- Allows flexibility with different ports

### Production
- **Remove localhost origins** from production build
- Only allow your actual production domain
- Use environment variables for configuration
- Example production config:
  ```javascript
  const allowedOrigins = process.env.NODE_ENV === 'production'
    ? [process.env.FRONTEND_URL]
    : ['http://localhost:5173', 'http://localhost:8081'];
  ```

## Verification Checklist

- [x] Backend CORS configuration updated
- [x] Multiple origins added to allowed list
- [x] Socket.io CORS updated
- [x] Backend restarted successfully
- [x] Database connected
- [ ] Frontend can make API requests (test this now)
- [ ] Login works without CORS errors
- [ ] Real-time updates work

## Next Steps

1. **Test the login** - Try logging in now, CORS error should be gone
2. **Check console** - Should see no CORS errors
3. **Verify functionality** - All API calls should work

If you still see CORS errors:
1. Check which origin is being blocked (see browser console)
2. Add that origin to `allowedOrigins` array
3. Restart backend
4. Clear browser cache and try again

---

**Status:** ✅ CORS Fixed  
**Backend:** ✅ Running with updated config  
**Date:** November 15, 2025  
**Next:** Test login functionality
