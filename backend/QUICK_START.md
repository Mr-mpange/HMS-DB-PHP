# Backend Quick Start Guide

## 🚀 Get Your MySQL Backend Running in 10 Minutes

### Step 1: Install MySQL (2 minutes)

#### Windows:
```bash
# Download from https://dev.mysql.com/downloads/installer/
# Or use Chocolatey:
choco install mysql
```

#### Mac:
```bash
brew install mysql
brew services start mysql
```

#### Linux:
```bash
sudo apt-get install mysql-server
sudo systemctl start mysql
```

### Step 2: Create Database (1 minute)

```bash
# Login to MySQL
mysql -u root -p

# Create database
CREATE DATABASE hospital_db;
exit;

# Import schema
mysql -u root -p hospital_db < database/schema.sql
```

### Step 3: Install Dependencies (2 minutes)

```bash
cd backend
npm install
```

### Step 4: Configure Environment (1 minute)

```bash
# Copy example env file
cp .env.example .env

# Edit .env with your settings
nano .env
```

Update these values:
```env
DB_PASSWORD=your_mysql_password
JWT_SECRET=your_random_secret_key_here
```

### Step 5: Start Server (1 minute)

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

You should see:
```
╔═══════════════════════════════════════════════════════╗
║   🏥 Hospital Management System API                  ║
║   Server running on port 3000                        ║
╚═══════════════════════════════════════════════════════╝
```

### Step 6: Test API (1 minute)

```bash
# Health check
curl http://localhost:3000/api/health

# Login with default admin
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@hospital.com","password":"admin123"}'
```

## ✅ You're Done!

Your backend is now running with:
- ✅ MySQL database
- ✅ JWT authentication
- ✅ Role-based authorization
- ✅ Real-time updates (Socket.io)
- ✅ Complete REST API
- ✅ Activity logging

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/change-password` - Change password

### Patients
- `GET /api/patients` - List patients
- `POST /api/patients` - Create patient
- `GET /api/patients/:id` - Get patient
- `PUT /api/patients/:id` - Update patient
- `DELETE /api/patients/:id` - Delete patient

### Appointments
- `GET /api/appointments` - List appointments
- `POST /api/appointments` - Create appointment
- `GET /api/appointments/:id` - Get appointment
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Delete appointment

### Prescriptions
- `GET /api/prescriptions` - List prescriptions
- `POST /api/prescriptions` - Create prescription
- `GET /api/prescriptions/:id` - Get prescription
- `PUT /api/prescriptions/:id` - Update prescription

### Lab Tests
- `GET /api/labs` - List lab tests
- `POST /api/labs` - Create lab test
- `GET /api/labs/:id` - Get lab test
- `PUT /api/labs/:id` - Update lab test
- `POST /api/labs/:id/results` - Add lab results

### Pharmacy
- `GET /api/pharmacy/medications` - List medications
- `POST /api/pharmacy/medications` - Add medication
- `POST /api/pharmacy/dispense/:id` - Dispense prescription

### Billing
- `GET /api/billing/invoices` - List invoices
- `POST /api/billing/invoices` - Create invoice
- `GET /api/billing/invoices/:id` - Get invoice
- `POST /api/billing/payments` - Record payment

### Activity Logs
- `GET /api/activity` - List activity logs

## 🔄 Real-time Updates

Connect to Socket.io:
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3000');

// Subscribe to updates
socket.emit('subscribe', 'appointments');
socket.emit('subscribe', 'patients');

// Listen for updates
socket.on('appointment:created', (data) => {
  console.log('New appointment:', data);
});

socket.on('patient:updated', (data) => {
  console.log('Patient updated:', data);
});
```

## 🔐 Authentication

All protected endpoints require JWT token:

```javascript
fetch('http://localhost:3000/api/patients', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
```

## 🧪 Testing

```bash
# Test login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@hospital.com","password":"admin123"}'

# Save the token from response
TOKEN="your_token_here"

# Test protected endpoint
curl http://localhost:3000/api/patients \
  -H "Authorization: Bearer $TOKEN"
```

## 📊 Default Admin Account

- **Email**: admin@hospital.com
- **Password**: admin123
- **Role**: admin

⚠️ **Change this password immediately in production!**

## 🔧 Troubleshooting

### Database connection failed
- Check MySQL is running: `mysql -u root -p`
- Verify credentials in `.env`
- Ensure database exists: `SHOW DATABASES;`

### Port already in use
- Change PORT in `.env`
- Or kill process: `lsof -ti:3000 | xargs kill`

### JWT errors
- Ensure JWT_SECRET is set in `.env`
- Check token expiration

## 📈 Next Steps

1. Update frontend to use this API
2. Implement remaining controllers
3. Add input validation
4. Set up production deployment
5. Configure SSL/HTTPS
6. Set up monitoring

## 🚀 Production Deployment

See `DEPLOYMENT.md` for production setup instructions.

---

**Status**: ✅ Ready for Development  
**Time to Setup**: ~10 minutes  
**Last Updated**: November 15, 2025
