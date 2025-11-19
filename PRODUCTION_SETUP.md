# Production Setup Guide for hasetcompany.or.tz

## 🔐 Security Configuration

### 1. Generate Strong JWT Secret

Run this command to generate a secure 64-character JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copy the output and use it as `JWT_SECRET` in your `.env` file.

### 2. Generate Session Secret

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copy the output and use it as `SESSION_SECRET` in your `.env` file.

### 3. Set Strong Database Password

**Requirements:**
- Minimum 16 characters
- Mix of uppercase, lowercase, numbers, and symbols
- No dictionary words

**Example Generator:**
```bash
node -e "console.log(require('crypto').randomBytes(24).toString('base64'))"
```

## 📦 Production Environment File

Create `public_html/api/.env` on your Hostinger server:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=hasetcompany_db_user
DB_PASSWORD=YOUR_STRONG_PASSWORD_HERE
DB_NAME=hasetcompany_hospital
DB_PORT=3306

# Database Connection Pool (Prevents crashes)
DB_CONNECTION_LIMIT=10
DB_QUEUE_LIMIT=0
DB_ACQUIRE_TIMEOUT=60000
DB_TIMEOUT=60000

# Server Configuration
PORT=3000
NODE_ENV=production

# JWT Secret (Use generated value from step 1)
JWT_SECRET=YOUR_GENERATED_JWT_SECRET_HERE

# Session Secret (Use generated value from step 2)
SESSION_SECRET=YOUR_GENERATED_SESSION_SECRET_HERE

# Frontend URL
FRONTEND_URL=https://hasetcompany.or.tz

# CORS Origins (Production only)
CORS_ORIGINS=https://hasetcompany.or.tz,https://www.hasetcompany.or.tz

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads

# Logging
LOG_LEVEL=error
LOG_FILE=./logs/production.log

# Security
BCRYPT_ROUNDS=12
JWT_EXPIRY=24h
COOKIE_SECURE=true
COOKIE_SAME_SITE=strict
```

## 🗄️ Database Setup

### Create Database in Hostinger

1. Log into Hostinger control panel
2. Go to **Databases** → **MySQL Databases**
3. Click **Create Database**
4. Database name: `hasetcompany_hospital`
5. Create user: `hasetcompany_db_user`
6. Generate strong password (save it securely!)
7. Grant all privileges to user

### Import Database Schema

1. Open **phpMyAdmin** from Hostinger panel
2. Select `hasetcompany_hospital` database
3. Go to **Import** tab
4. Choose file: `backend/database_schema.sql`
5. Click **Go**
6. Wait for success message

### Verify Import

Run these queries in phpMyAdmin SQL tab:

```sql
-- Check tables
SHOW TABLES;

-- Check default admin user
SELECT email, role FROM users WHERE role = 'admin';

-- Check departments
SELECT name FROM departments;
```

You should see:
- 20+ tables
- 1 admin user (admin@hospital.com)
- 4 departments

## 🌐 Domain Configuration

### Update Frontend API URL

Before building, update `src/lib/api.ts`:

```typescript
const API_URL = import.meta.env.PROD 
  ? 'https://hasetcompany.or.tz/api'
  : 'http://localhost:3000';
```

### Configure .htaccess

Create `public_html/.htaccess`:

```apache
# Enable Rewrite Engine
RewriteEngine On

# Force HTTPS
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Force www to non-www (or vice versa)
RewriteCond %{HTTP_HOST} ^www\.hasetcompany\.or\.tz [NC]
RewriteRule ^(.*)$ https://hasetcompany.or.tz/$1 [L,R=301]

# API Proxy to Backend
RewriteCond %{REQUEST_URI} ^/api/
RewriteRule ^api/(.*)$ http://localhost:3000/$1 [P,L]

# Frontend SPA Routing
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.html [L]

# Security Headers
<IfModule mod_headers.c>
    Header set X-Content-Type-Options "nosniff"
    Header set X-Frame-Options "SAMEORIGIN"
    Header set X-XSS-Protection "1; mode=block"
    Header set Referrer-Policy "strict-origin-when-cross-origin"
    Header set Permissions-Policy "geolocation=(), microphone=(), camera=()"
</IfModule>

# Disable Directory Listing
Options -Indexes

# Protect .env files
<FilesMatch "^\.env">
    Order allow,deny
    Deny from all
</FilesMatch>
```

## 🔒 Enable SSL Certificate

### In Hostinger Control Panel:

1. Go to **SSL** section
2. Select your domain: `hasetcompany.or.tz`
3. Click **Install SSL**
4. Choose **Free SSL** (Let's Encrypt)
5. Wait 5-15 minutes for activation
6. Verify: Visit `https://hasetcompany.or.tz`

### Force HTTPS

Already configured in `.htaccess` above. Test:
- Visit `http://hasetcompany.or.tz` → Should redirect to HTTPS
- Visit `https://hasetcompany.or.tz` → Should work

## 🚀 Start Backend with PM2

### Install PM2

```bash
npm install -g pm2
```

### Start Application

```bash
cd public_html/api
pm2 start src/server.js --name hospital-api --env production
pm2 save
pm2 startup
```

### Verify Running

```bash
pm2 status
pm2 logs hospital-api --lines 50
```

You should see:
```
✅ Database connected successfully
📊 Pool: 10 connections, Queue: unlimited
🚀 Server running on port 3000
```

## 📊 Database Backup Setup

### Manual Backup

```bash
mysqldump -u hasetcompany_db_user -p hasetcompany_hospital > backup_$(date +%Y%m%d).sql
```

### Automated Daily Backups

```bash
# Create backup directory
mkdir -p ~/backups

# Edit crontab
crontab -e

# Add this line (runs daily at 2 AM)
0 2 * * * mysqldump -u hasetcompany_db_user -p'YOUR_PASSWORD' hasetcompany_hospital > ~/backups/hospital_$(date +\%Y\%m\%d).sql

# Add cleanup (keep last 30 days)
0 3 * * * find ~/backups -name "hospital_*.sql" -mtime +30 -delete
```

### Backup Verification

```bash
# List backups
ls -lh ~/backups/

# Test restore (on test database)
mysql -u hasetcompany_db_user -p test_db < ~/backups/hospital_20231118.sql
```

## ✅ Production Checklist

Before going live:

- [ ] Generated strong JWT_SECRET (64+ characters)
- [ ] Generated strong SESSION_SECRET (64+ characters)
- [ ] Set strong database password (16+ characters)
- [ ] Created database: `hasetcompany_hospital`
- [ ] Imported `database_schema.sql`
- [ ] Created `.env` file with production values
- [ ] Updated CORS to `hasetcompany.or.tz` only
- [ ] Set `NODE_ENV=production`
- [ ] Enabled SSL certificate
- [ ] Configured `.htaccess`
- [ ] Started backend with PM2
- [ ] Tested HTTPS redirect
- [ ] Tested API endpoint: `https://hasetcompany.or.tz/api/health`
- [ ] Tested login page
- [ ] Changed default admin password
- [ ] Setup automated database backups
- [ ] Configured firewall (if applicable)
- [ ] Tested all major features

## 🧪 Testing Production

### Test Backend API

```bash
curl https://hasetcompany.or.tz/api/health
```

Expected response:
```json
{"status":"ok","timestamp":"2023-11-18T..."}
```

### Test Frontend

1. Visit: `https://hasetcompany.or.tz`
2. Should load login page
3. Login with: `admin@hospital.com` / `admin123`
4. **Immediately change password!**

### Test Features

- [ ] Patient registration
- [ ] Appointment booking
- [ ] Doctor dashboard
- [ ] Nurse dashboard
- [ ] Receptionist dashboard
- [ ] Quick service assignment
- [ ] Medical services management
- [ ] Pharmacy module
- [ ] Lab module
- [ ] Billing & payments

## 🔧 Monitoring

### View Logs

```bash
# Real-time logs
pm2 logs hospital-api

# Last 100 lines
pm2 logs hospital-api --lines 100

# Error logs only
pm2 logs hospital-api --err
```

### Monitor Performance

```bash
pm2 monit
```

### Restart if Needed

```bash
pm2 restart hospital-api
```

## 🆘 Troubleshooting

### Backend Not Starting

```bash
pm2 logs hospital-api --err
```

Common issues:
- Database credentials wrong
- Port 3000 already in use
- Missing .env file

### Database Connection Error

```bash
# Test connection
mysql -u hasetcompany_db_user -p hasetcompany_hospital -e "SELECT 1"
```

### 502 Bad Gateway

- Backend not running: `pm2 restart hospital-api`
- Check `.htaccess` proxy configuration
- Verify port 3000 accessible

### CORS Errors

- Update `CORS_ORIGINS` in `.env`
- Restart: `pm2 restart hospital-api`
- Clear browser cache

## 📞 Support

For issues:
1. Check PM2 logs: `pm2 logs hospital-api`
2. Check browser console (F12)
3. Verify database connection
4. Review this guide

---

**Domain:** hasetcompany.or.tz  
**Status:** Production Ready ✅  
**Last Updated:** November 2025
