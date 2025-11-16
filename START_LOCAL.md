# 🚀 Quick Start - Local Testing

## Test Your System Locally (5 Minutes)

---

## Step 1: Start Backend (2 minutes)

Open **Terminal 1** (PowerShell or CMD):

```bash
cd backend
npm install
npm start
```

✅ You should see:
```
✓ Database connected
✓ Server running on http://localhost:3000
```

❌ If you see errors:
- Check MySQL is running: `net start MySQL80`
- Check `backend/.env` file exists
- Run migrations: `npm run migrate`

---

## Step 2: Start Frontend (2 minutes)

Open **Terminal 2** (PowerShell or CMD):

```bash
npm install
npm run dev
```

✅ You should see:
```
  VITE ready in xxx ms
  ➜  Local:   http://localhost:5173/
```

---

## Step 3: Open Browser (1 minute)

Open your browser and go to:
```
http://localhost:5173
```

✅ You should see the Hospital Management System login page

---

## Quick Test

1. **Login Page Loads** ✓
2. **No Console Errors** (Press F12 to check)
3. **Can Navigate** (Click around)

---

## Troubleshooting

### Backend Won't Start

**Error:** `Cannot connect to database`

**Fix:**
```bash
# Start MySQL
net start MySQL80

# Create database
mysql -u root -p
CREATE DATABASE hospital_management;
EXIT;

# Run migrations
cd backend
npm run migrate
```

---

### Frontend Can't Connect

**Error:** `Network Error`

**Fix:**
1. Check backend is running (Terminal 1)
2. Check URL: `http://localhost:3000/health`
3. Verify `.env` has: `VITE_API_URL=http://localhost:3000`

---

### Port Already in Use

**Error:** `Port 3000 is already in use`

**Fix:**
```bash
# Find and kill process
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

---

## Test Checklist

Quick things to test:

- [ ] Application loads
- [ ] Login page appears
- [ ] No red errors in console (F12)
- [ ] Can click around without crashes
- [ ] Dashboard loads (after login)

---

## Full Testing

For comprehensive testing, see: `LOCAL_TESTING_GUIDE.md`

---

## When Ready for Production

After successful local testing:

1. ✅ Everything works locally
2. ✅ No errors in console
3. ✅ All features tested

**Next:** Read `PRODUCTION_COMPLETE.md` for deployment

---

## Quick Commands

```bash
# Start backend
cd backend && npm start

# Start frontend (new terminal)
npm run dev

# Test backend
curl http://localhost:3000/health

# Test frontend
curl http://localhost:5173

# Run test script (Windows)
test-local.bat

# Run test script (Mac/Linux)
./test-local.sh
```

---

## Need Help?

1. Check console errors (F12)
2. Check backend terminal for errors
3. Verify MySQL is running
4. Check `.env` files exist
5. See `LOCAL_TESTING_GUIDE.md` for details

---

**Status:** Ready for Local Testing ✅  
**Time:** ~5 minutes  
**Next:** Test locally, then deploy to production
