# Complete Route Testing Guide - Frontend to Backend

## 🎯 Overview

This guide tests all API routes from frontend to backend to ensure complete functionality.

## 📋 Complete Route Map

### Authentication Routes (`/api/auth`)
| Method | Endpoint | Frontend Usage | Status |
|--------|----------|----------------|--------|
| POST | `/auth/register` | User registration | ✅ |
| POST | `/auth/login` | User login | ✅ |
| POST | `/auth/logout` | User logout | ✅ |
| GET | `/auth/me` | Get current user | ✅ |
| POST | `/auth/change-password` | Change password | ✅ |

### Patient Routes (`/api/patients`)
| Method | Endpoint | Frontend Usage | Status |
|--------|----------|----------------|--------|
| GET | `/patients` | List all patients | ✅ |
| GET | `/patients/:id` | Get single patient | ✅ |
| POST | `/patients` | Create patient | ✅ |
| PUT | `/patients/:id` | Update patient | ✅ |
| DELETE | `/patients/:id` | Delete patient | ✅ |

### Appointment Routes (`/api/appointments`)
| Method | Endpoint | Frontend Usage | Status |
|--------|----------|----------------|--------|
| GET | `/appointments` | List appointments | ✅ |
| GET | `/appointments/:id` | Get appointment | ✅ |
| POST | `/appointments` | Create appointment | ✅ |
| PUT | `/appointments/:id` | Update appointment | ✅ |
| DELETE | `/appointments/:id` | Delete appointment | ✅ |

### Prescription Routes (`/api/prescriptions`)
| Method | Endpoint | Frontend Usage | Status |
|--------|----------|----------------|--------|
| GET | `/prescriptions` | List prescriptions | ✅ |
| POST | `/prescriptions` | Create prescription | ✅ |
| PUT | `/prescriptions/:id` | Update prescription | ✅ |

### Lab Routes (`/api/labs`)
| Method | Endpoint | Frontend Usage | Status |
|--------|----------|----------------|--------|
| GET | `/labs` | List lab tests | ✅ |
| GET | `/labs/:id` | Get lab test | ✅ |
| POST | `/labs` | Create lab test | ✅ |
| PUT | `/labs/:id` | Update lab test | ✅ |
| POST | `/labs/:id/results` | Add lab results | ✅ |
| GET | `/labs/:id/results` | Get lab results | ✅ |

### Pharmacy Routes (`/api/pharmacy`)
| Method | Endpoint | Frontend Usage | Status |
|--------|----------|----------------|--------|
| GET | `/pharmacy/medications` | List medications | ✅ |
| GET | `/pharmacy/medications/low-stock` | Low stock items | ✅ |
| GET | `/pharmacy/medications/:id` | Get medication | ✅ |
| POST | `/pharmacy/medications` | Create medication | ✅ |
| PUT | `/pharmacy/medications/:id` | Update medication | ✅ |
| PUT | `/pharmacy/medications/:id/stock` | Update stock | ✅ |
| POST | `/pharmacy/dispense/:id` | Dispense prescription | ✅ |

### Billing Routes (`/api/billing`)
| Method | Endpoint | Frontend Usage | Status |
|--------|----------|----------------|--------|
| GET | `/billing/invoices` | List invoices | ✅ |
| GET | `/billing/invoices/:id` | Get invoice | ✅ |
| POST | `/billing/invoices` | Create invoice | ✅ |
| PUT | `/billing/invoices/:id` | Update invoice | ✅ |
| GET | `/billing/payments` | List payments | ✅ |
| POST | `/billing/payments` | Record payment | ✅ |

### Visit Routes (`/api/visits`)
| Method | Endpoint | Frontend Usage | Status |
|--------|----------|----------------|--------|
| GET | `/visits` | List visits | ✅ |
| GET | `/visits/stage/:stage` | Get by stage | ✅ |
| GET | `/visits/:id` | Get visit | ✅ |
| POST | `/visits` | Create visit | ✅ |
| PUT | `/visits/:id/stage` | Update stage | ✅ |
| PUT | `/visits/:id/complete` | Complete visit | ✅ |
| PUT | `/visits/:id/cancel` | Cancel visit | ✅ |

### User Routes (`/api/users`) - Admin Only
| Method | Endpoint | Frontend Usage | Status |
|--------|----------|----------------|--------|
| GET | `/users` | List users | ✅ |
| GET | `/users/:id` | Get user | ✅ |
| POST | `/users` | Create user | ✅ |
| PUT | `/users/:id` | Update user | ✅ |
| DELETE | `/users/:id` | Delete user | ✅ |
| POST | `/users/:id/roles` | Assign role | ✅ |
| DELETE | `/users/:id/roles` | Remove role | ✅ |
| POST | `/users/:id/reset-password` | Reset password | ✅ |

### Upload Routes (`/api/upload`)
| Method | Endpoint | Frontend Usage | Status |
|--------|----------|----------------|--------|
| POST | `/upload` | Upload file | ✅ |
| GET | `/upload/entity/:type/:id` | Get files | ✅ |
| GET | `/upload/:id` | Get file metadata | ✅ |
| GET | `/upload/:id/download` | Download file | ✅ |
| DELETE | `/upload/:id` | Delete file | ✅ |
| GET | `/upload` | List all (admin) | ✅ |

### Activity Routes (`/api/activity`) - Admin Only
| Method | Endpoint | Frontend Usage | Status |
|--------|----------|----------------|--------|
| GET | `/activity` | List activity logs | ✅ |

## 🧪 Testing Instructions

### Step 1: Start Backend
```bash
cd backend
npm run dev
```

Backend should be running on `http://localhost:3000`

### Step 2: Test Health Endpoint
```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-11-15T...",
  "environment": "development"
}
```

### Step 3: Test Authentication
```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@hospital.com","password":"admin123"}'
```

Expected response:
```json
{
  "token": "eyJhbGc...",
  "user": {
    "id": "...",
    "email": "admin@hospital.com",
    "full_name": "System Administrator",
    "roles": ["admin"],
    "primaryRole": "admin"
  }
}
```

Save the token for subsequent requests:
```bash
TOKEN="your_token_here"
```

### Step 4: Test Each Route Category

#### Test Patients
```bash
# Get all patients
curl http://localhost:3000/api/patients \
  -H "Authorization: Bearer $TOKEN"

# Create patient
curl -X POST http://localhost:3000/api/patients \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Test Patient",
    "phone": "1234567890",
    "email": "test@example.com",
    "gender": "Male"
  }'
```

#### Test Appointments
```bash
# Get all appointments
curl http://localhost:3000/api/appointments \
  -H "Authorization: Bearer $TOKEN"

# Create appointment
curl -X POST http://localhost:3000/api/appointments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "patient_id": "patient-uuid",
    "doctor_id": "doctor-uuid",
    "appointment_date": "2025-11-20",
    "appointment_time": "10:00:00",
    "appointment_type": "Consultation"
  }'
```

#### Test Prescriptions
```bash
# Get all prescriptions
curl http://localhost:3000/api/prescriptions \
  -H "Authorization: Bearer $TOKEN"
```

#### Test Lab Tests
```bash
# Get all lab tests
curl http://localhost:3000/api/labs \
  -H "Authorization: Bearer $TOKEN"
```

#### Test Pharmacy
```bash
# Get all medications
curl http://localhost:3000/api/pharmacy/medications \
  -H "Authorization: Bearer $TOKEN"

# Get low stock
curl http://localhost:3000/api/pharmacy/medications/low-stock \
  -H "Authorization: Bearer $TOKEN"
```

#### Test Billing
```bash
# Get all invoices
curl http://localhost:3000/api/billing/invoices \
  -H "Authorization: Bearer $TOKEN"

# Get all payments
curl http://localhost:3000/api/billing/payments \
  -H "Authorization: Bearer $TOKEN"
```

#### Test Visits
```bash
# Get all visits
curl http://localhost:3000/api/visits \
  -H "Authorization: Bearer $TOKEN"

# Get visits by stage
curl http://localhost:3000/api/visits/stage/nurse \
  -H "Authorization: Bearer $TOKEN"
```

#### Test Users (Admin)
```bash
# Get all users
curl http://localhost:3000/api/users \
  -H "Authorization: Bearer $TOKEN"
```

#### Test Activity Logs (Admin)
```bash
# Get activity logs
curl http://localhost:3000/api/activity \
  -H "Authorization: Bearer $TOKEN"
```

## 🎨 Frontend Testing

### Step 1: Start Frontend
```bash
npm run dev
```

Frontend should be running on `http://localhost:5173`

### Step 2: Test Login
1. Navigate to `http://localhost:5173/auth`
2. Login with:
   - Email: `admin@hospital.com`
   - Password: `admin123`
3. Should redirect to admin dashboard

### Step 3: Test Each Dashboard

#### Admin Dashboard
- URL: `/admin`
- Test: View statistics, manage users, view activity logs

#### Doctor Dashboard
- URL: `/doctor`
- Test: View appointments, create prescriptions, order lab tests

#### Nurse Dashboard
- URL: `/nurse`
- Test: View patient queue, record vitals

#### Lab Dashboard
- URL: `/lab`
- Test: View lab tests, enter results

#### Pharmacy Dashboard
- URL: `/pharmacy`
- Test: View prescriptions, dispense medications

#### Billing Dashboard
- URL: `/billing`
- Test: View invoices, record payments

#### Receptionist Dashboard
- URL: `/receptionist`
- Test: Register patients, book appointments

## 🔄 Real-time Testing

### Test Socket.io Connection

Open browser console and run:
```javascript
import { getSocket } from '@/lib/api';

const socket = getSocket();

// Subscribe to updates
socket.emit('subscribe', 'patients');

// Listen for events
socket.on('patient:created', (data) => {
  console.log('New patient created:', data);
});

socket.on('patient:updated', (data) => {
  console.log('Patient updated:', data);
});
```

### Test Real-time Updates
1. Open two browser windows
2. In window 1: Create a patient
3. In window 2: Should see the update in real-time

## ✅ Testing Checklist

### Backend Routes
- [ ] Health endpoint responds
- [ ] Authentication works (login/logout)
- [ ] Patients CRUD operations
- [ ] Appointments CRUD operations
- [ ] Prescriptions CRUD operations
- [ ] Lab tests CRUD operations
- [ ] Pharmacy operations
- [ ] Billing operations
- [ ] Visit workflow operations
- [ ] User management (admin)
- [ ] File upload/download
- [ ] Activity logs (admin)

### Frontend Pages
- [ ] Login page works
- [ ] Admin dashboard loads
- [ ] Doctor dashboard loads
- [ ] Nurse dashboard loads
- [ ] Lab dashboard loads
- [ ] Pharmacy dashboard loads
- [ ] Billing dashboard loads
- [ ] Receptionist dashboard loads

### Real-time Features
- [ ] Socket.io connects
- [ ] Real-time updates work
- [ ] Subscriptions work
- [ ] Events trigger correctly

### Security
- [ ] Unauthorized requests blocked (401)
- [ ] Role-based access works
- [ ] JWT tokens validated
- [ ] Activity logging works

## 🐛 Common Issues & Solutions

### Issue: "Cannot connect to backend"
**Solution**: 
- Check backend is running on port 3000
- Verify `VITE_API_URL` in `.env`
- Check firewall settings

### Issue: "401 Unauthorized"
**Solution**:
- Check JWT token is valid
- Re-login to get new token
- Verify token in localStorage

### Issue: "CORS error"
**Solution**:
- Check CORS configuration in backend
- Verify `FRONTEND_URL` in backend `.env`
- Restart backend server

### Issue: "Real-time not working"
**Solution**:
- Check Socket.io connection
- Verify `VITE_SOCKET_URL` in `.env`
- Check browser console for errors

## 📊 Expected Response Formats

### Success Response
```json
{
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "error": "Error message"
}
```

### List Response
```json
{
  "items": [...],
  "total": 100,
  "limit": 10,
  "offset": 0
}
```

## 🎯 Performance Testing

### Load Testing
```bash
# Install Apache Bench
# Test endpoint performance
ab -n 1000 -c 10 http://localhost:3000/api/health
```

### Response Time Goals
- Health check: < 50ms
- Authentication: < 200ms
- Data fetch: < 500ms
- Data create: < 1000ms

## 📈 Monitoring

### Check Logs
```bash
# Backend logs
cd backend
npm run dev

# Watch for errors in console
```

### Check Database
```bash
mysql -u root -p hospital_db

# Check recent activity
SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 10;

# Check user sessions
SELECT * FROM sessions WHERE expires_at > NOW();
```

---

**Total Routes**: 60+ endpoints  
**Status**: ✅ All Implemented  
**Documentation**: Complete  
**Last Updated**: November 15, 2025
