# 🪟 Windows Quick Start Guide

## Super Easy Method (Double-Click)

### Step 1: Start Backend
1. Double-click `start-backend.bat`
2. Wait for "Server running on http://localhost:3000"
3. **Keep this window open!**

### Step 2: Start Frontend
1. Double-click `start-frontend.bat`
2. Wait for "Local: http://localhost:5173"
3. **Keep this window open!**

### Step 3: Open Browser
1. Open your browser
2. Go to: `http://localhost:5173`
3. Test the application!

---

## If Double-Click Doesn't Work

### Fix PowerShell Issue First

**Option A: Use Command Prompt (CMD)**
1. Press `Win + R`
2. Type `cmd`
3. Press Enter
4. Follow commands below

**Option B: Fix PowerShell**
1. Press `Win + X`
2. Select "Terminal (Admin)" or "PowerShell (Admin)"
3. Run: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`
4. Type `Y` and press Enter

---

## Manual Method (Using CMD)

### Terminal 1 - Backend

```cmd
cd C:\Users\Administrator\Desktop\hospital\med-scribe-quest\backend
npm install
npm start
```

**Keep this window open!**

### Terminal 2 - Frontend

Open **new** CMD window:

```cmd
cd C:\Users\Administrator\Desktop\hospital\med-scribe-quest
npm install
npm run dev
```

**Keep this window open!**

### Browser

Open: `http://localhost:5173`

---

## Common Errors & Fixes

### Error: "npm is not recognized"

**Fix:** Install Node.js
1. Download from: https://nodejs.org
2. Install LTS version
3. Restart CMD
4. Try again

---

### Error: "Cannot find path backend\backend"

**Fix:** You're already in backend folder!

Instead of:
```cmd
cd backend
npm install
```

Just run:
```cmd
npm install
npm start
```

---

### Error: "Port 3000 is already in use"

**Fix:** Kill the process

```cmd
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

Replace `<PID>` with the number you see.

---

### Error: "Cannot connect to database"

**Fix:** Start MySQL

```cmd
net start MySQL80
```

If MySQL not installed:
1. Download from: https://dev.mysql.com/downloads/mysql/
2. Install MySQL 8.0
3. Remember your root password!

---

## Verify Everything Works

### Check Backend
Open browser: `http://localhost:3000/health`

Should see: `{"status":"ok"}`

### Check Frontend
Open browser: `http://localhost:5173`

Should see: Hospital Management System login page

---

## Stop Servers

### To Stop:
1. Go to each CMD window
2. Press `Ctrl + C`
3. Type `Y` if asked
4. Close windows

---

## Quick Reference

### Start Everything
```cmd
REM Terminal 1
cd C:\Users\Administrator\Desktop\hospital\med-scribe-quest\backend
npm start

REM Terminal 2 (new window)
cd C:\Users\Administrator\Desktop\hospital\med-scribe-quest
npm run dev
```

### Test
```
http://localhost:5173
```

### Stop
```
Ctrl + C in each terminal
```

---

## Troubleshooting

### Nothing Works?

1. **Check Node.js installed:**
   ```cmd
   node -v
   npm -v
   ```
   Should show versions.

2. **Check MySQL running:**
   ```cmd
   net start MySQL80
   ```

3. **Check you're in correct folder:**
   ```cmd
   cd
   ```
   Should show project path.

4. **Try using CMD instead of PowerShell**

5. **See:** `WINDOWS_SETUP_FIX.md` for detailed fixes

---

## Need More Help?

- **PowerShell Issues:** See `WINDOWS_SETUP_FIX.md`
- **Detailed Testing:** See `LOCAL_TESTING_GUIDE.md`
- **General Help:** See `START_LOCAL.md`

---

**Status:** Ready to start on Windows! 🪟✅
