# Hospital Management System - Backend API

Complete Node.js + Express + MySQL backend that replaces Supabase.

## ✅ Features

- JWT Authentication
- Role-Based Authorization
- Real-time Updates (Socket.io)
- Activity Logging
- Complete REST API
- Security (Helmet, Rate Limiting, CORS)
- MySQL Database

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your MySQL credentials

# 3. Create database and import schema
mysql -u root -p
CREATE DATABASE hospital_db;
exit;
mysql -u root -p hospital_db < database/schema.sql

# 4. Start server
npm run dev
```

Server runs on http://localhost:3000

## 📚 Documentation

- `QUICK_START.md` - 10-minute setup guide
- `../FRONTEND_MYSQL_INTEGRATION.md` - Frontend integration
- `../MYSQL_COMPLETE_SOLUTION.md` - Complete solution overview

## 🔐 Default Admin

- Email: admin@hospital.com
- Password: admin123

⚠️ Change this in production!

## 📡 API Endpoints

See `QUICK_START.md` for complete API documentation.

## 🧪 Testing

```bash
# Health check
curl http://localhost:3000/api/health

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@hospital.com","password":"admin123"}'
```

## 🔧 Development

```bash
npm run dev    # Development with auto-reload
npm start      # Production
```

## 📦 Dependencies

- express - Web framework
- mysql2 - MySQL client
- bcrypt - Password hashing
- jsonwebtoken - JWT auth
- socket.io - Real-time updates
- helmet - Security headers
- cors - CORS handling
- express-rate-limit - Rate limiting

## 🚀 Production

1. Set NODE_ENV=production
2. Use strong JWT_SECRET
3. Configure production database
4. Set up SSL/HTTPS
5. Enable monitoring

---

**Status**: Production Ready  
**Version**: 1.0.0
