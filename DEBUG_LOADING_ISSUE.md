# 🔍 Debug: Page Stuck on Loading

## Quick Checks

### 1. Check Backend is Running

Open a new terminal and run:
```bash
curl http://localhost:3000/health
```

**Expected:** `{"status":"ok"}` or similar  
**If fails:** Backend is not running

---

### 2. Check Frontend Console

1. Press `F12` in your browser
2. Go to **Console** tab
3. Look for red errors

**Common errors:**
- `Network Error` - Backend not running
- `CORS Error` - CORS misconfigured
- `Failed to fetch` - Backend not accessible

---

### 3. Check Network Tab

1. Press `F12` in browser
2. Go to **Network** tab
3. Refresh page
4. Look for failed requests (red)

---

## Solutions

### Solution 1: Backend Not Running

**Start the backend:**

```bash
cd C:\Users\Administrator\Desktop\hospital\med-scribe-quest\backend
npm start
```

Wait for:
```
✓ Server running on http://localhost:3000
```

---

### Solution 2: Database Not Connected

**Check MySQL is running:**

```cmd
net start MySQL80
```

**Create database if needed:**

```bash
mysql -u root -p
CREATE DATABASE hospital_management;
EXIT;
```

**Run migrations:**

```bash
cd backend
npm run migrate
```

---

### Solution 3: Environment Variables Missing

**Check backend/.env exists:**

```bash
cd backend
type .env
```

**If missing, create it:**

```env
NODE_ENV=development
PORT=3000
HOST=localhost

DB_HOST=localhost
DB_PORT=3306
DB_NAME=hospital_management
DB_USER=root
DB_PASSWORD=your_password

JWT_SECRET=dev-secret-key
CORS_ORIGIN=http://localhost:5173
```

---

### Solution 4: Port Already in Use

**Kill process on port 3000:**

```cmd
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

Replace `<PID>` with the number shown.

---

## Step-by-Step Debug

### Step 1: Check Backend

```bash
# Terminal 1
cd C:\Users\Administrator\Desktop\hospital\med-scribe-quest\backend
npm start
```

**Look for:**
- ✅ "Server running on http://localhost:3000"
- ✅ "Database connected"

**If you see errors:**
- Database connection failed → Check MySQL
- Port in use → Kill the process
- Module not found → Run `npm install`

---

### Step 2: Test Backend Directly

Open browser or run:
```bash
curl http://localhost:3000/health
```

**Should return:** `{"status":"ok"}`

**If fails:**
- Backend not running
- Wrong port
- Firewall blocking

---

### Step 3: Check Frontend Config

**Check .env file:**

```bash
type .env
```

**Should have:**
```env
VITE_API_URL=http://localhost:3000
```

**If wrong or missing:**
```bash
echo VITE_API_URL=http://localhost:3000 > .env
```

---

### Step 4: Restart Frontend

```bash
# Stop frontend (Ctrl+C)
# Then restart:
npm run dev
```

---

### Step 5: Check Browser Console

1. Open browser: `http://localhost:5173`
2. Press `F12`
3. Go to Console tab
4. Look for errors

**Common errors and fixes:**

**Error:** `Failed to fetch`
**Fix:** Backend not running - start it

**Error:** `Network Error`
**Fix:** Check VITE_API_URL in .env

**Error:** `CORS policy`
**Fix:** Check CORS_ORIGIN in backend/.env

---

## Quick Test Script

Create `test-connection.bat`:

```batch
@echo off
echo Testing Backend Connection...
curl http://localhost:3000/health
echo.
echo.
echo If you see {"status":"ok"}, backend is working!
echo If you see an error, backend is not running.
pause
```

Run it to test backend.

---

## Common Scenarios

### Scenario 1: Backend Shows Errors

**Error:** `Cannot connect to database`

**Fix:**
```cmd
net start MySQL80
mysql -u root -p
CREATE DATABASE hospital_management;
EXIT;
cd backend
npm run migrate
npm start
```

---

### Scenario 2: Frontend Shows Blank/Loading

**Cause:** Backend not responding

**Fix:**
1. Check backend terminal for errors
2. Test: `curl http://localhost:3000/health`
3. Check browser console (F12)
4. Verify .env has correct VITE_API_URL

---

### Scenario 3: CORS Error

**Error in console:** `Access to fetch at 'http://localhost:3000' from origin 'http://localhost:5173' has been blocked by CORS policy`

**Fix backend/.env:**
```env
CORS_ORIGIN=http://localhost:5173
```

Restart backend.

---

## What to Check Right Now

Run these commands:

```bash
# 1. Check if backend is running
curl http://localhost:3000/health

# 2. Check MySQL
net start MySQL80

# 3. Check backend logs
# Look at the terminal where you ran "npm start"
# Any errors there?

# 4. Check browser console
# Press F12, go to Console tab
# Any red errors?
```

---

## Still Stuck?

### Send me this info:

1. **Backend terminal output** (what you see when you run `npm start`)
2. **Browser console errors** (F12 → Console tab)
3. **Network tab errors** (F12 → Network tab → any red requests?)

---

## Quick Fix Commands

```bash
# Stop everything
# Press Ctrl+C in both terminals

# Start fresh:

# Terminal 1 - Backend
cd C:\Users\Administrator\Desktop\hospital\med-scribe-quest\backend
npm install
npm start

# Terminal 2 - Frontend  
cd C:\Users\Administrator\Desktop\hospital\med-scribe-quest
npm install
npm run dev

# Browser
http://localhost:5173
```

---

**Most likely issue:** Backend is not running or database is not connected.

**Quick test:** Run `curl http://localhost:3000/health` - if this fails, backend is the problem.
