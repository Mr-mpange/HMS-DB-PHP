# 🧪 Local Testing Guide

## Test Your System Locally Before Production

**Recommended:** Always test locally before deploying to production!

---

## Quick Start (5 minutes)

### 1. Start Backend
```bash
cd backend
npm install
npm start
```

Backend will run on: `http://localhost:3000`

### 2. Start Frontend (New Terminal)
```bash
# In project root
npm install
npm run dev
```

Frontend will run on: `http://localhost:5173`

### 3. Open Browser
```
http://localhost:5173
```

---

## Detailed Setup

### Prerequisites
- ✅ Node.js 18+ installed
- ✅ MySQL 8.0+ installed and running
- ✅ Git installed

### Step 1: Database Setup (5 minutes)

#### Start MySQL
```bash
# Windows
net start MySQL80

# Mac/Linux
sudo systemctl start mysql
# or
brew services start mysql
```

#### Create Database
```bash
mysql -u root -p
```

```sql
CREATE DATABASE hospital_management;
CREATE USER 'hospital_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON hospital_management.* TO 'hospital_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

#### Run Migrations
```bash
cd backend
npm run migrate
```

### Step 2: Configure Environment

#### Backend Configuration
```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:
```env
NODE_ENV=development
PORT=3000
HOST=localhost

# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=hospital_management
DB_USER=hospital_user
DB_PASSWORD=your_password

# JWT
JWT_SECRET=dev-secret-change-in-production
JWT_EXPIRES_IN=24h

# CORS
CORS_ORIGIN=http://localhost:5173
```

#### Frontend Configuration
```bash
# In project root
cp .env.example .env
```

Edit `.env`:
```env
VITE_API_URL=http://localhost:3000
VITE_APP_ENV=development
```

### Step 3: Install Dependencies

#### Backend
```bash
cd backend
npm install
```

#### Frontend
```bash
# In project root
npm install
```

### Step 4: Start Services

#### Terminal 1 - Backend
```bash
cd backend
npm run dev
```

You should see:
```
✓ Database connected
✓ Server running on http://localhost:3000
```

#### Terminal 2 - Frontend
```bash
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### Step 5: Test the Application

Open browser: `http://localhost:5173`

---

## Testing Checklist

### Basic Functionality
- [ ] Application loads without errors
- [ ] Login page appears
- [ ] Can create test user
- [ ] Can login successfully
- [ ] Dashboard loads

### User Roles
- [ ] Admin dashboard works
- [ ] Doctor dashboard works
- [ ] Nurse dashboard works
- [ ] Receptionist dashboard works
- [ ] Pharmacy dashboard works
- [ ] Lab dashboard works
- [ ] Billing dashboard works

### Core Features
- [ ] Register new patient
- [ ] Book appointment
- [ ] Check-in patient
- [ ] Record vital signs
- [ ] Doctor consultation
- [ ] Order lab tests
- [ ] Prescribe medication
- [ ] Dispense medication
- [ ] Process payment

### Data Operations
- [ ] Create records
- [ ] Read/view records
- [ ] Update records
- [ ] Delete records
- [ ] Search functionality

---

## Common Issues & Solutions

### Issue: Backend won't start

**Error:** `Cannot connect to database`

**Solution:**
```bash
# Check MySQL is running
mysql -u root -p

# Verify database exists
SHOW DATABASES;

# Check credentials in backend/.env
```

---

### Issue: Frontend can't connect to backend

**Error:** `Network Error` or `CORS Error`

**Solution:**
1. Check backend is running on port 3000
2. Verify `VITE_API_URL=http://localhost:3000` in `.env`
3. Check `CORS_ORIGIN=http://localhost:5173` in `backend/.env`

---

### Issue: Port already in use

**Error:** `Port 3000 is already in use`

**Solution:**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3000 | xargs kill -9
```

---

### Issue: Database migration fails

**Error:** `Migration failed`

**Solution:**
```bash
# Reset database
mysql -u root -p
DROP DATABASE hospital_management;
CREATE DATABASE hospital_management;
EXIT;

# Run migrations again
cd backend
npm run migrate
```

---

## Development Tools

### View Backend Logs
```bash
cd backend
npm run dev
# Logs appear in terminal
```

### View Frontend Logs
```bash
# Open browser console (F12)
# Check Console tab for errors
```

### Test API Endpoints
```bash
# Test health endpoint
curl http://localhost:3000/health

# Test with authentication
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

### Database Inspection
```bash
mysql -u hospital_user -p hospital_management

# View tables
SHOW TABLES;

# View data
SELECT * FROM patients LIMIT 5;
SELECT * FROM appointments LIMIT 5;
```

---

## Sample Test Data

### Create Test User
```bash
# Register via UI or API
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@hospital.com",
    "password": "Admin123!",
    "full_name": "Admin User",
    "phone": "0712345678"
  }'
```

### Create Test Patient
```sql
INSERT INTO patients (full_name, date_of_birth, gender, phone, email, address)
VALUES ('John Doe', '1990-01-01', 'Male', '0712345678', 'john@example.com', '123 Main St');
```

---

## Performance Testing

### Check Page Load Time
```bash
# Open browser DevTools (F12)
# Go to Network tab
# Reload page
# Check load time (should be < 3 seconds)
```

### Check API Response Time
```bash
# Install Apache Bench
# Windows: Download from Apache website
# Mac: brew install httpd
# Linux: apt-get install apache2-utils

# Test API
ab -n 100 -c 10 http://localhost:3000/api/health
```

---

## Browser Testing

Test in multiple browsers:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if on Mac)

Test responsive design:
- [ ] Desktop (1920x1080)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)

---

## Debugging Tips

### Enable Debug Mode

**Backend:**
```env
# backend/.env
LOG_LEVEL=debug
```

**Frontend:**
```env
# .env
VITE_ENABLE_DEBUG_MODE=true
```

### Check Network Requests
1. Open DevTools (F12)
2. Go to Network tab
3. Perform action
4. Check requests/responses

### Check Console Errors
1. Open DevTools (F12)
2. Go to Console tab
3. Look for red errors

---

## Test Scenarios

### Scenario 1: New Patient Registration
1. Go to Receptionist Dashboard
2. Click "Register New Patient"
3. Fill in patient details
4. Submit form
5. Verify patient appears in list

### Scenario 2: Book Appointment
1. Go to Receptionist Dashboard
2. Click "Book Appointment"
3. Select patient
4. Select doctor
5. Choose date/time
6. Submit
7. Verify appointment created

### Scenario 3: Patient Check-in
1. Go to Receptionist Dashboard
2. Find scheduled appointment
3. Click "Check In"
4. Process payment
5. Verify patient moved to nurse queue

### Scenario 4: Record Vitals
1. Go to Nurse Dashboard
2. Find patient in queue
3. Click "Record Vitals"
4. Enter vital signs
5. Submit
6. Verify patient moved to doctor queue

### Scenario 5: Doctor Consultation
1. Go to Doctor Dashboard
2. Find patient in queue
3. Start consultation
4. Add diagnosis
5. Order lab tests (optional)
6. Prescribe medication
7. Complete consultation

### Scenario 6: Dispense Medication
1. Go to Pharmacy Dashboard
2. Find pending prescription
3. Click "Dispense"
4. Confirm medication
5. Submit
6. Verify patient moved to billing

### Scenario 7: Process Payment
1. Go to Billing Dashboard
2. Find patient invoice
3. Click "Process Payment"
4. Enter payment details
5. Submit
6. Verify payment recorded

---

## Automated Testing (Optional)

### Run Tests
```bash
# Backend tests
cd backend
npm test

# Frontend tests
npm test
```

### Create Test Script
```bash
# test-local.sh
#!/bin/bash

echo "Testing backend..."
curl -f http://localhost:3000/health || exit 1

echo "Testing frontend..."
curl -f http://localhost:5173 || exit 1

echo "All tests passed!"
```

---

## When You're Ready for Production

After successful local testing:

1. ✅ All features work correctly
2. ✅ No console errors
3. ✅ Performance is acceptable
4. ✅ All test scenarios pass
5. ✅ Tested in multiple browsers

**Next Steps:**
1. Read `PRODUCTION_COMPLETE.md`
2. Configure production environment
3. Run `./deploy.sh`
4. Deploy to production

---

## Quick Commands Reference

```bash
# Start backend
cd backend && npm run dev

# Start frontend
npm run dev

# Check backend health
curl http://localhost:3000/health

# View backend logs
cd backend && npm run dev

# Reset database
mysql -u root -p
DROP DATABASE hospital_management;
CREATE DATABASE hospital_management;
EXIT;
cd backend && npm run migrate

# Kill process on port
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3000 | xargs kill -9
```

---

## Support

### Issues?
1. Check console for errors (F12)
2. Check backend logs
3. Verify database connection
4. Check environment variables
5. Restart services

### Still stuck?
- Review error messages carefully
- Check `backend/.env` configuration
- Verify MySQL is running
- Ensure ports 3000 and 5173 are free

---

**Status:** Ready for Local Testing ✅  
**Next:** Test locally, then deploy to production
