# MySQL Backend - Complete Setup Guide

## 🎯 What We're Building

A complete Node.js + Express backend that replaces all Supabase features:
- ✅ Authentication (JWT-based)
- ✅ Authorization (Role-based)
- ✅ REST API (All endpoints)
- ✅ Real-time Updates (Socket.io)
- ✅ Security (Application-level RLS)
- ✅ File Upload (if needed)

## 📦 Quick Start

### 1. Create Backend Project

```bash
mkdir hospital-backend
cd hospital-backend
npm init -y
```

### 2. Install Dependencies

```bash
npm install express mysql2 bcrypt jsonwebtoken cors dotenv socket.io
npm install express-validator helmet express-rate-limit
npm install --save-dev nodemon
```

### 3. Project Structure

```
hospital-backend/
├── src/
│   ├── config/
│   │   ├── database.js
│   │   └── socket.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── roleCheck.js
│   │   └── security.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── patientController.js
│   │   ├── appointmentController.js
│   │   ├── prescriptionController.js
│   │   ├── labController.js
│   │   ├── pharmacyController.js
│   │   └── billingController.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── patients.js
│   │   ├── appointments.js
│   │   └── ... (other routes)
│   ├── utils/
│   │   ├── logger.js
│   │   └── helpers.js
│   └── server.js
├── .env
├── .gitignore
└── package.json
```

## 🗄️ MySQL Database Setup

### Complete Schema

I'll create a complete SQL file with all tables...

