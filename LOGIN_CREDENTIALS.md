# 🔐 Login Credentials - Hospital Management System

## Default User Accounts

### 👨‍💼 Admin Account
```
Email:    admin@hospital.com
Password: admin123
Role:     System Administrator
```

**Admin Capabilities:**
- Full system access
- User management (create, edit, delete users)
- Role assignment
- System settings configuration
- View all reports and analytics
- Activity logs monitoring
- Medical services management
- Access all dashboards

### 👨‍⚕️ Doctor Account
```
Email:    doctor@hospital.com
Password: doctor123
Role:     Doctor
```

**Doctor Capabilities:**
- Patient consultations
- Medical records management
- Prescription creation
- Lab test ordering
- Patient queue management
- View patient history

---

## 🚀 How to Login

### Via Frontend (Web Interface)

1. **Start the backend:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start the frontend:**
   ```bash
   npm run dev
   ```

3. **Open browser:**
   ```
   http://localhost:5173
   ```

4. **Login with admin credentials:**
   - Email: `admin@hospital.com`
   - Password: `admin123`

5. **You'll be redirected to:** Admin Dashboard

### Via API (Direct)

```bash
# Login request
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@hospital.com",
    "password": "admin123"
  }'

# Response will include:
# {
#   "success": true,
#   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
#   "user": {
#     "id": "...",
#     "email": "admin@hospital.com",
#     "full_name": "System Administrator",
#     "role": "admin"
#   }
# }
```

---

## 🔧 Creating Additional Users

### Method 1: Via Admin Dashboard (Recommended)

1. Login as admin
2. Navigate to "User Management" section
3. Click "Add New User"
4. Fill in details:
   - Email
   - Full Name
   - Phone
   - Role (admin, doctor, nurse, lab_tech, pharmacist, billing, receptionist)
5. User will receive email with activation link

### Method 2: Via API

```bash
# Get admin token first
TOKEN="your_admin_token_here"

# Create new user
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "email": "nurse@hospital.com",
    "password": "nurse123",
    "full_name": "Jane Doe",
    "phone": "1234567892",
    "role": "nurse"
  }'
```

### Method 3: Via Database Script

Run the admin creation script:
```bash
cd backend
node create-admin.js
```

---

## 🔒 Security Best Practices

### ⚠️ IMPORTANT - Change Default Passwords!

**Before deploying to production:**

1. **Change admin password:**
   - Login as admin
   - Go to Settings → Change Password
   - Use a strong password (min 12 characters, mixed case, numbers, symbols)

2. **Change doctor password:**
   - Login as doctor
   - Go to Settings → Change Password

3. **Update environment variables:**
   ```env
   JWT_SECRET=your-very-secure-random-string-here
   ```

### Password Requirements

For production, enforce:
- Minimum 12 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character
- No common passwords

---

## 👥 Available Roles

| Role | Dashboard Access | Key Features |
|------|-----------------|--------------|
| **admin** | Admin Dashboard | Full system control, user management, reports |
| **doctor** | Doctor Dashboard | Consultations, prescriptions, patient records |
| **nurse** | Nurse Dashboard | Vital signs, patient triage, care notes |
| **receptionist** | Receptionist Dashboard | Patient registration, appointments, queue |
| **lab_tech** | Lab Dashboard | Lab tests, results entry |
| **pharmacist** | Pharmacy Dashboard | Prescriptions, medication dispensing |
| **billing** | Billing Dashboard | Invoices, payments, financial reports |
| **patient** | Patient Dashboard | View own records, appointments, bills |

---

## 🧪 Testing Accounts

For development/testing, you can create test accounts:

```bash
# Nurse
Email: nurse@hospital.com
Password: nurse123

# Receptionist
Email: receptionist@hospital.com
Password: receptionist123

# Lab Tech
Email: lab@hospital.com
Password: lab123

# Pharmacist
Email: pharmacy@hospital.com
Password: pharmacy123

# Billing
Email: billing@hospital.com
Password: billing123
```

**Note:** These are not created by default. Use the admin dashboard or API to create them.

---

## 🔍 Troubleshooting Login Issues

### "Invalid credentials" error

1. **Check if backend is running:**
   ```bash
   curl http://localhost:3000/api/health
   ```

2. **Verify database connection:**
   ```bash
   cd backend
   node create-admin.js
   ```
   This will recreate the admin user if needed.

3. **Check database:**
   ```sql
   USE hospital_db;
   SELECT email, full_name FROM users;
   ```

### "Token expired" error

- Tokens expire after 24 hours
- Simply login again to get a new token

### "User not found" error

- Run `node create-admin.js` to create default users
- Check database connection in `.env` file

### Frontend not redirecting after login

1. Check browser console for errors
2. Verify `VITE_API_URL` in `.env`
3. Clear browser cache and localStorage
4. Check that AuthContext is properly configured

---

## 📝 Password Reset

### For Admin to Reset User Password

1. Login as admin
2. Go to User Management
3. Find the user
4. Click "Reset Password"
5. Enter new password
6. User can now login with new password

### Self-Service Password Reset (Future Feature)

Currently not implemented. Users must contact admin for password reset.

---

## 🔐 Token Management

### Token Storage

- Frontend stores JWT token in `localStorage` as `auth_token`
- Token includes: user ID, email, role, expiration

### Token Expiration

- Default: 24 hours
- Configurable in `backend/src/middleware/auth.js`

### Logout

```javascript
// Frontend
localStorage.removeItem('auth_token');
window.location.href = '/auth';
```

---

## 📊 Quick Reference

| Action | Endpoint | Method | Auth Required |
|--------|----------|--------|---------------|
| Login | `/api/auth/login` | POST | No |
| Register | `/api/auth/register` | POST | No |
| Get Profile | `/api/auth/profile` | GET | Yes |
| Update Profile | `/api/auth/profile` | PUT | Yes |
| Change Password | `/api/auth/change-password` | POST | Yes |
| Logout | Client-side only | - | - |

---

## 🎯 Quick Start Checklist

- [ ] Backend running (`cd backend && npm run dev`)
- [ ] Frontend running (`npm run dev`)
- [ ] Database created and schema imported
- [ ] Admin user created (`node create-admin.js`)
- [ ] Can access http://localhost:5173
- [ ] Can login with admin@hospital.com / admin123
- [ ] Redirected to admin dashboard after login

---

**Last Updated:** November 15, 2025  
**Default Admin:** admin@hospital.com / admin123  
**⚠️ Remember to change default passwords in production!**
