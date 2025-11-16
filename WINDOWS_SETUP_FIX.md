# Windows Setup Fix

## Issue: PowerShell Script Execution Blocked

You're seeing this error:
```
npm : File C:\Program Files\nodejs\npm.ps1 cannot be loaded because 
running scripts is disabled on this system.
```

---

## Quick Fix (Choose One)

### Option 1: Use CMD Instead (Easiest)

**Close PowerShell and open CMD (Command Prompt):**

1. Press `Win + R`
2. Type `cmd`
3. Press Enter

Then run:
```cmd
cd C:\Users\Administrator\Desktop\hospital\med-scribe-quest\backend
npm install
npm start
```

---

### Option 2: Fix PowerShell (Recommended)

**Run PowerShell as Administrator:**

1. Press `Win + X`
2. Select "Windows PowerShell (Admin)" or "Terminal (Admin)"
3. Run this command:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

4. Type `Y` and press Enter

Now you can use npm in PowerShell!

---

## Correct Commands

Since you're already in the backend folder, use:

### If in backend folder:
```bash
# You're here: C:\...\med-scribe-quest\backend
npm install
npm start
```

### If in project root:
```bash
# You're here: C:\...\med-scribe-quest
cd backend
npm install
npm start
```

---

## Step-by-Step: Start Backend

**Terminal 1 (CMD or PowerShell as Admin):**

```cmd
cd C:\Users\Administrator\Desktop\hospital\med-scribe-quest\backend
npm install
npm start
```

Wait for:
```
✓ Server running on http://localhost:3000
```

---

## Step-by-Step: Start Frontend

**Terminal 2 (New CMD or PowerShell):**

```cmd
cd C:\Users\Administrator\Desktop\hospital\med-scribe-quest
npm install
npm run dev
```

Wait for:
```
➜  Local:   http://localhost:5173/
```

---

## Quick Test

Open browser:
```
http://localhost:5173
```

---

## Still Having Issues?

### Check Your Location
```cmd
cd
```

Should show:
- For backend: `C:\Users\Administrator\Desktop\hospital\med-scribe-quest\backend`
- For frontend: `C:\Users\Administrator\Desktop\hospital\med-scribe-quest`

### Check Node.js
```cmd
node -v
npm -v
```

Should show versions (e.g., v18.x.x)

---

## Alternative: Use Git Bash

If you have Git installed:

1. Open Git Bash
2. Navigate to project:
```bash
cd /c/Users/Administrator/Desktop/hospital/med-scribe-quest/backend
npm install
npm start
```

---

## Summary

**Problem:** PowerShell blocking npm scripts  
**Solution:** Use CMD or fix PowerShell execution policy

**Quick Fix:**
1. Open CMD (not PowerShell)
2. Navigate to backend folder
3. Run `npm install` then `npm start`
4. Open new CMD for frontend
5. Run `npm install` then `npm run dev`

---

**Status:** Ready to start! Use CMD or fix PowerShell policy.
