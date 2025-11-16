# 🔧 Quick Troubleshooting Guide

## Current Status

✅ Backend running on: `http://localhost:3000`  
✅ CORS configured for multiple origins  
✅ Authentication migrated to MySQL API  
✅ Admin user created  

## Common Issues & Solutions

### 1. CORS Error

**Error:**
```
Access to XMLHttpRequest blocked by CORS policy
```

**Solution:**
- ✅ Already fixed! Backend now allows multiple origins
- If still seeing error, check your frontend port
- Add your port to `backend/src/server.js` allowedOrigins array
- Restart backend: `cd backend && node src/server.js`

### 2. Network Error / Connection Refused

**Error:**
```
POST http://localhost:3000/api/auth/login net::ERR_FAILED
```

**Check:**
1. Is backend running?
   ```bash
   curl http://localhost:3000/api/health
   ```
   
2. If not, start it:
   ```bash
   cd backend
   node src/server.js
   ```

3. Check database connection in `backend/.env`

### 3. Invalid Credentials

**Error:**
```
Invalid email or password
```

**Solution:**
1. Verify admin user exists:
   ```bash
   cd backend
   node create-admin.js
   ```

2. Use correct credentials:
   - Email: `admin@hospital.com`
   - Password: `admin123`

3. Check database:
   ```sql
   USE hospital_db;
   SELECT email, full_name FROM users;
   ```

### 4. Token Not Persisting

**Issue:** Logged out after page refresh

**Check:**
1. Browser localStorage has `auth_token`
   - Open DevTools → Application → Local Storage
   - Should see `auth_token` key

2. Token not expired (24 hours default)

3. Backend JWT_SECRET is set in `.env`

**Solution:**
- Clear browser cache and localStorage
- Login again
- Check browser console for errors

### 5. Frontend Not Starting

**Error:**
```
Port 5173 is already in use
```

**Solution:**
1. Kill process on that port:
   ```bash
   # Windows
   netstat -ano | findstr :5173
   taskkill /PID <PID> /F
   ```

2. Or use different port:
   ```bash
   npm run dev -- --port 8081
   ```

### 6. Backend Not Starting

**Error:**
```
EADDRINUSE: address already in use :::3000
```

**Solution:**
1. Kill process on port 3000:
   ```bash
   # Windows
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F
   ```

2. Or change port in `backend/.env`:
   ```env
   PORT=3001
   ```

### 7. Database Connection Error

**Error:**
```
ER_ACCESS_DENIED_ERROR: Access denied for user
```

**Check `backend/.env`:**
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=hospital_db
```

**Solution:**
1. Verify MySQL is running
2. Check credentials are correct
3. Ensure database exists:
   ```sql
   CREATE DATABASE IF NOT EXISTS hospital_db;
   ```

### 8. Supabase Warnings in Console

**Warning:**
```
⚠️ Supabase client stub loaded
```

**This is expected!**
- Stub files are temporary during migration
- Warnings remind you to complete migration
- Authentication is already migrated (no more Supabase auth)
- Other features still need migration

**To remove warnings:**
- Complete migration of all dashboard pages
- See `MIGRATION_CHECKLIST.md`

### 9. Role Not Loading

**Issue:** User logged in but no role/dashboard access

**Check:**
1. User has role in database:
   ```sql
   SELECT u.email, ur.role 
   FROM users u 
   JOIN user_roles ur ON u.id = ur.user_id 
   WHERE u.email = 'admin@hospital.com';
   ```

2. Login response includes roles:
   - Open DevTools → Network → login request
   - Check response has `roles` and `primaryRole`

**Solution:**
- Run `node create-admin.js` to recreate admin with roles
- Check `user_roles` table has entries

### 10. Real-time Updates Not Working

**Issue:** Changes don't appear without refresh

**This is expected!**
- Real-time features not yet migrated
- Socket.io configured but not implemented in frontend
- See `MIGRATION_CHECKLIST.md` for Socket.io migration

## Quick Commands

### Start Everything
```bash
# Terminal 1 - Backend
cd backend
node src/server.js

# Terminal 2 - Frontend
npm run dev
```

### Check Status
```bash
# Backend health
curl http://localhost:3000/api/health

# Test login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@hospital.com","password":"admin123"}'
```

### Reset Admin User
```bash
cd backend
node create-admin.js
```

### Check Logs
- Backend: Check terminal where `node src/server.js` is running
- Frontend: Check browser console (F12)

## Environment Files

### Backend `.env`
```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=hospital_db

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=24h

# Server
PORT=3000
NODE_ENV=development

# Frontend (optional)
FRONTEND_URL=http://localhost:8081
```

### Frontend `.env`
```env
# API
VITE_API_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000

# App
VITE_APP_URL=http://localhost:5173
```

## Getting Help

### Check Documentation
1. `LOGIN_CREDENTIALS.md` - Login details
2. `AUTH_MIGRATION_COMPLETE.md` - Auth system details
3. `CORS_FIX_COMPLETE.md` - CORS configuration
4. `MIGRATION_CHECKLIST.md` - Migration progress
5. `backend/README.md` - Backend API docs

### Debug Steps
1. Check backend is running
2. Check frontend is running
3. Check browser console for errors
4. Check backend terminal for errors
5. Check Network tab in DevTools
6. Verify environment variables
7. Clear browser cache/localStorage

### Still Stuck?
1. Check all environment files are correct
2. Restart both backend and frontend
3. Clear browser cache completely
4. Try in incognito/private window
5. Check firewall isn't blocking ports

---

**Last Updated:** November 15, 2025  
**Status:** Ready for testing
