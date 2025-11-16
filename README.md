# 🏥 Hospital Management System

A comprehensive, production-ready hospital management system with patient records, appointments, prescriptions, lab tests, pharmacy, and billing.

## 🚀 Quick Start

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Production Deployment

**📖 [DEPLOY NOW - Quick Start Guide](DEPLOY_NOW.md)**

Choose your deployment method:
- **Hostinger + Railway** ($3/month) - [Guide](HOSTINGER_QUICK_START.md)
- **VPS Deployment** ($6/month) - [Guide](DEPLOY_WITHOUT_DOCKER.md)
- **Docker Deployment** ($6/month) - [Guide](PRODUCTION_DEPLOYMENT.md)

## ✨ Features

### Core Functionality
- ✅ **Patient Management** - Complete patient records and history
- ✅ **Appointments** - Scheduling and management
- ✅ **Prescriptions** - Electronic prescription system
- ✅ **Lab Tests** - Order, track, and manage lab results
- ✅ **Pharmacy** - Medication inventory and dispensing
- ✅ **Billing** - Invoice generation and payment processing
- ✅ **File Upload** - Secure document management
- ✅ **Real-time Updates** - Live notifications via Socket.io

### User Roles
- **Admin** - Full system access
- **Doctor** - Patient records, prescriptions, lab orders
- **Nurse** - Patient vitals, basic information
- **Lab Technician** - Lab tests and results
- **Pharmacist** - Medication management
- **Billing Staff** - Invoices and payments
- **Receptionist** - Patient registration, appointments

### Security
- ✅ JWT Authentication
- ✅ Role-based Access Control
- ✅ Bcrypt Password Hashing
- ✅ Rate Limiting
- ✅ CORS Protection
- ✅ Security Headers (Helmet)
- ✅ Input Validation

### Integrations
- ✅ **ZenoPay** - Payment gateway integration
- ✅ **Socket.io** - Real-time updates
- ✅ **MySQL** - Robust database

## 🏗️ Architecture

```
Frontend (React + TypeScript)
    ↓
Backend API (Node.js + Express)
    ↓
MySQL Database
```

## 📦 Tech Stack

### Frontend
- React 18
- TypeScript
- Vite
- TailwindCSS
- Shadcn/ui
- React Router
- React Query
- Socket.io Client
- Axios

### Backend
- Node.js
- Express
- MySQL
- JWT
- Bcrypt
- Socket.io
- Multer (File Upload)

## 🚀 Deployment Options

### Option 1: Hostinger + Railway (Recommended)
**Cost:** $3/month | **Time:** 15 minutes

Frontend on Hostinger, Backend on Railway (free tier)

**📖 [Complete Guide](HOSTINGER_QUICK_START.md)**

### Option 2: VPS Deployment
**Cost:** $6/month | **Time:** 30 minutes

Everything on one VPS (DigitalOcean, Vultr, Linode)

**📖 [Complete Guide](DEPLOY_WITHOUT_DOCKER.md)**

### Option 3: Docker Deployment
**Cost:** $6/month | **Time:** 5 minutes

Containerized deployment with Docker Compose

**📖 [Complete Guide](PRODUCTION_DEPLOYMENT.md)**

## 📚 Documentation

### Deployment Guides
- **[DEPLOY_NOW.md](DEPLOY_NOW.md)** - Quick deployment reference
- **[HOSTINGER_QUICK_START.md](HOSTINGER_QUICK_START.md)** - Hostinger deployment
- **[DEPLOY_SHARED_HOSTING.md](DEPLOY_SHARED_HOSTING.md)** - Shared hosting guide
- **[DEPLOY_WITHOUT_DOCKER.md](DEPLOY_WITHOUT_DOCKER.md)** - VPS deployment
- **[PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md)** - Docker deployment
- **[DEPLOYMENT_OPTIONS.md](DEPLOYMENT_OPTIONS.md)** - Compare all options

### Configuration & Security
- **[PRODUCTION_READY_FINAL.md](PRODUCTION_READY_FINAL.md)** - Complete production guide
- **[SECURITY.md](SECURITY.md)** - Security best practices
- **[DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)** - Deployment checklist

### API & Testing
- **[ROUTE_TESTING_COMPLETE.md](ROUTE_TESTING_COMPLETE.md)** - API testing results
- **[backend/postman-collection.json](backend/postman-collection.json)** - Postman collection

## 🔧 Development

### Prerequisites
- Node.js 18+
- MySQL 8.0+
- npm or yarn

### Setup

```bash
# Clone repository
git clone <your-repo-url>
cd hospital-management-system

# Install dependencies
npm install

# Setup backend
cd backend
npm install
cp .env.example .env
# Configure .env with your database credentials

# Setup database
node setup-tables.js
node create-admin.js

# Start backend
npm start

# Start frontend (in another terminal)
cd ..
npm run dev
```

### Default Credentials

**Admin:**
- Email: `admin@hospital.com`
- Password: `admin123`

**Doctor:**
- Email: `doctor@hospital.com`
- Password: `doctor123`

⚠️ **Change these passwords in production!**

## 🧪 Testing

### Test All Routes

```bash
# Backend must be running
cd backend
npm start

# Run tests
./test-all-routes.ps1  # Windows
./test-all-routes.sh   # Linux/Mac
```

### API Endpoints

All endpoints tested and working:
- ✅ Authentication (`/api/auth/*`)
- ✅ Patients (`/api/patients/*`)
- ✅ Appointments (`/api/appointments/*`)
- ✅ Prescriptions (`/api/prescriptions/*`)
- ✅ Lab Tests (`/api/labs/*`)
- ✅ Pharmacy (`/api/pharmacy/*`)
- ✅ Billing (`/api/billing/*`)
- ✅ Visits (`/api/visits/*`)
- ✅ Users (`/api/users/*`)
- ✅ File Upload (`/api/upload/*`)

## 📊 Database Schema

15 tables with proper relationships:
- users, user_roles, profiles
- patients, patient_visits
- appointments, prescriptions
- lab_tests, lab_results
- medications, medication_dispensing
- invoices, payments
- file_uploads, sessions, activity_logs

## 🔐 Security Features

- JWT-based authentication
- Role-based access control (7 roles)
- Bcrypt password hashing (10 rounds)
- Rate limiting (100 requests/15min)
- CORS configuration
- Security headers (Helmet)
- Input validation (express-validator)
- SQL injection prevention
- XSS prevention
- File upload restrictions
- Session management
- Activity logging

## 📈 Performance

- Database connection pooling
- Query optimization with indexes
- Gzip compression
- Static file caching
- Cluster mode support (PM2)
- Load balancing ready

## 🔄 Backup & Recovery

Automated backup scripts included:
- Daily database backups
- 7-day retention
- Compression (gzip)
- Encryption support
- Cloud storage ready

## 📞 Support

### Documentation
- Check the [deployment guides](DEPLOY_NOW.md)
- Review [security best practices](SECURITY.md)
- Follow the [deployment checklist](DEPLOYMENT_CHECKLIST.md)

### External Resources
- **Railway:** https://docs.railway.app
- **Render:** https://render.com/docs
- **Hostinger:** https://www.hostinger.com/tutorials

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🎉 Ready to Deploy?

Your application is **100% production-ready**!

**Start here:** [DEPLOY_NOW.md](DEPLOY_NOW.md)

**Questions?** Check the [documentation](PRODUCTION_READY_FINAL.md)

---

**Built with ❤️ for healthcare professionals**
