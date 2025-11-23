# Real-Time Updates Setup Guide

## Overview
The system now uses Socket.io for real-time updates instead of polling. This means:
- ✅ No more page refreshes
- ✅ Instant updates when data changes
- ✅ Better performance
- ✅ Updates happen in the background

## Setup Instructions

### 1. Install Socket.io Server Dependencies

```bash
# Install Node.js dependencies for socket server
npm install express socket.io cors --save
npm install nodemon --save-dev
```

### 2. Start the Socket.io Server

Open a new terminal and run:

```bash
node socket-server.js
```

Or for development with auto-restart:

```bash
npx nodemon socket-server.js
```

The socket server will run on **http://localhost:3000**

### 3. Configure Laravel Backend

Add to your `.env` file:

```env
SOCKET_SERVER_URL=http://localhost:3000
```

### 4. Start the System

You need 3 terminals running:

**Terminal 1 - Socket Server:**
```bash
node socket-server.js
```

**Terminal 2 - Laravel Backend:**
```bash
cd backend
php artisan serve
```

**Terminal 3 - Frontend:**
```bash
npm run dev
```

## How It Works

### Real-Time Events

The system emits these events automatically:

1. **visit:updated** - When a patient visit is updated
   - Nurse completes vitals → Doctor sees patient instantly
   - Lab completes test → Doctor notified
   - Any workflow stage change

2. **patient:registered** - When a new patient is registered
   - Receptionist registers patient → All dashboards update

3. **appointment:created** - When a new appointment is created
   - New appointment → Doctor's schedule updates

4. **lab:completed** - When a lab test is completed
   - Lab tech completes test → Doctor notified

5. **prescription:created** - When a prescription is created
   - Doctor prescribes → Pharmacy notified

### Frontend Implementation

The DoctorDashboard now listens for these events:

```typescript
// Set up Socket.io for real-time updates
const socket = getSocket();

socket.on('visit:updated', (data) => {
  // Only refresh if it affects this doctor
  if (data.current_stage === 'doctor' || data.doctor_id === user.id) {
    fetchData(); // Refresh data
  }
});
```

### Backend Implementation

When data changes, emit socket events:

```php
use App\Helpers\SocketHelper;

// After updating a visit
SocketHelper::visitUpdated($visit);

// After registering a patient
SocketHelper::patientRegistered($patient);

// After creating an appointment
SocketHelper::appointmentCreated($appointment);
```

## Testing Real-Time Updates

### Test 1: Nurse to Doctor Flow

1. Login as **nurse@test.com** / **Nurse@123**
2. Complete vitals for a patient
3. In another browser/tab, login as **doctor@test.com** / **Doctor@123**
4. **Watch the doctor dashboard update automatically** (no refresh needed!)

### Test 2: Patient Registration

1. Login as **receptionist@test.com** / **Receptionist@123**
2. Register a new patient
3. Check other dashboards - they update automatically

### Test 3: Lab Results

1. Login as **labtech@test.com** / **LabTech@123**
2. Complete a lab test
3. Doctor dashboard updates automatically

## Troubleshooting

### Socket Server Not Starting

**Error:** `Cannot find module 'express'`

**Solution:**
```bash
npm install express socket.io cors
```

### Frontend Not Connecting

**Check:**
1. Socket server is running on port 3000
2. No firewall blocking port 3000
3. Check browser console for connection errors

**Fix:**
```bash
# Make sure socket server is running
node socket-server.js
```

### Events Not Firing

**Check:**
1. Laravel .env has `SOCKET_SERVER_URL=http://localhost:3000`
2. Socket server is running
3. Check socket server console for event logs

**Test manually:**
```bash
# Test socket server
curl http://localhost:3000/health
```

Should return:
```json
{
  "status": "ok",
  "clients": 1,
  "uptime": 123.45
}
```

## Production Deployment

### 1. Deploy Socket Server

Use PM2 to keep socket server running:

```bash
npm install -g pm2
pm2 start socket-server.js --name hms-socket
pm2 save
pm2 startup
```

### 2. Configure Production URLs

Update `.env`:
```env
SOCKET_SERVER_URL=https://your-domain.com:3000
```

Update frontend `src/lib/api.ts`:
```typescript
const socketURL = 'https://your-domain.com:3000';
```

### 3. Use Nginx Reverse Proxy

Add to nginx config:
```nginx
location /socket.io/ {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
}
```

## Benefits

### Before (Polling)
- ❌ Page refreshes every 30-120 seconds
- ❌ High server load
- ❌ Delayed updates
- ❌ Wasted bandwidth

### After (Socket.io)
- ✅ Instant updates
- ✅ Low server load
- ✅ Real-time notifications
- ✅ Efficient bandwidth usage

## Files Created

1. **socket-server.js** - Socket.io server
2. **socket-package.json** - Dependencies
3. **backend/app/Helpers/SocketHelper.php** - Laravel helper
4. **src/lib/api.ts** - Socket.io client (already existed)

## Next Steps

1. ✅ Install dependencies: `npm install express socket.io cors`
2. ✅ Start socket server: `node socket-server.js`
3. ✅ Add to .env: `SOCKET_SERVER_URL=http://localhost:3000`
4. ✅ Test real-time updates
5. ✅ Deploy to production with PM2

## Support

If you encounter issues:
1. Check all 3 services are running (socket, backend, frontend)
2. Check browser console for errors
3. Check socket server console for connection logs
4. Verify .env configuration

---

**Status:** ✅ Real-time updates implemented
**Last Updated:** November 21, 2025
