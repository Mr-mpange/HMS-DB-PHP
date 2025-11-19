# Hospital Management System

A comprehensive web-based Hospital Management System built with React, Node.js, Express, and MySQL.

## ✨ Features

### Patient Management
- Patient registration with complete medical history
- Search and filter patients
- Patient demographics and contact information
- Medical history tracking
- Insurance information management

### Appointment System
- Schedule appointments with doctors
- Department-based appointment booking
- Real-time appointment status tracking
- Today's appointments dashboard
- Appointment cancellation and rescheduling

### Doctor Dashboard
- View scheduled appointments
- Patient consultation interface
- Write prescriptions
- Order lab tests
- Update patient medical records
- Track consultation history

### Nurse Dashboard
- View assigned patients
- Service delivery tracking
- Vital signs recording
- Patient care management

### Receptionist Dashboard
- Patient check-in/check-out
- Quick service assignment (wound dressing, injections, etc.)
- Appointment scheduling
- Patient registration
- Payment collection

### Pharmacy Management
- Medication inventory
- Prescription fulfillment
- Stock management
- Expiry date tracking
- Medication dispensing

### Laboratory Management
- Lab test ordering
- Test result entry
- Lab service catalog
- Test status tracking
- Integration with medical services

### Medical Services Catalog
- Service management (procedures, tests, consultations)
- Pricing management
- Service categories (Laboratory, Radiology, Procedure, etc.)
- Bulk import via CSV
- Edit and delete services

### Billing & Payments
- Invoice generation
- Payment processing
- Multiple payment methods (Cash, Card, Insurance)
- Payment history
- Outstanding balance tracking

### User Management
- Role-based access control
- Multiple user roles (Admin, Doctor, Nurse, Receptionist, Pharmacist, Lab Technician)
- User activity logging
- Secure authentication with JWT

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** - Fast build tool
- **TailwindCSS** - Utility-first CSS
- **Shadcn/ui** - Component library
- **React Router** - Navigation
- **Axios** - HTTP client
- **Sonner** - Toast notifications

### Backend
- **Node.js** with Express
- **MySQL/MariaDB** - Database
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Multer** - File uploads

## 📋 Prerequisites

- **Node.js** 18 or higher
- **MySQL** 5.7+ or **MariaDB** 10.3+
- **npm** or **yarn**

## 🚀 Local Development Setup

### 1. Clone Repository
```bash
git clone <repository-url>
cd HMS-DB
```

### 2. Install Dependencies

**Frontend:**
```bash
npm install
```

**Backend:**
```bash
cd backend
npm install
cd ..
```

### 3. Database Setup

**Create Database:**
```bash
mysql -u root -p
```

```sql
CREATE DATABASE hospital_db;
exit
```

**Import Schema:**
```bash
mysql -u root -p hospital_db < backend/database_schema.sql
```

This creates all tables and inserts default data:
- Default admin user: `admin@hospital.com` / `admin123` (⚠️ Change this!)
- 4 default departments (General Medicine, Pediatrics, Surgery, Emergency)

### 4. Configure Environment

**Backend Configuration:**

Copy the example file:
```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:
```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=hospital_db
DB_PORT=3306

# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Secret (Generate a strong random string)
JWT_SECRET=your_secret_key_minimum_32_characters_long

# Frontend URL
FRONTEND_URL=http://localhost:5173

# CORS Origins
CORS_ORIGINS=http://localhost:5173,http://localhost:8081
```

**Generate Strong JWT Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 5. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```
Backend runs on `http://localhost:3000`

**Terminal 2 - Frontend:**
```bash
npm run dev
```
Frontend runs on `http://localhost:5173`

### 6. Access Application

Open browser: `http://localhost:5173`

**Default Login:**
- Email: `admin@hospital.com`
- Password: `admin123`

⚠️ **Important:** Change the default password immediately after first login!

## 📦 Production Deployment (Hostinger)

### Quick Deploy

**Windows:**
```bash
deploy.bat
```

**Linux/Mac:**
```bash
chmod +x deploy.sh
./deploy.sh
```

This creates a `deployment` folder with optimized production files.

### Manual Deployment Steps

#### 1. Build Frontend
```bash
npm install
npm run build
```

This creates a `dist` folder with optimized files.

#### 2. Prepare Backend
```bash
cd backend
npm install --production
cd ..
```

#### 3. Setup Hostinger Database

**In Hostinger Control Panel:**
1. Go to **Databases** → **MySQL Databases**
2. Create database: `hospital_db`
3. Create database user with strong password
4. Grant all privileges
5. Note: database name, username, password, host

**Import Database:**
1. Open phpMyAdmin from Hostinger panel
2. Select `hospital_db`
3. Go to **Import** tab
4. Upload `backend/database_schema.sql`
5. Click **Go**

#### 4. Upload Files

**Using File Manager:**
1. Upload `dist/*` files to `public_html/`
2. Create folder `public_html/api/`
3. Upload `backend/src/` to `public_html/api/src/`
4. Upload `backend/package.json` to `public_html/api/`
5. Upload `backend/package-lock.json` to `public_html/api/`

**File Structure:**
```
public_html/
├── index.html
├── assets/
├── (other frontend files)
└── api/
    ├── src/
    ├── package.json
    ├── package-lock.json
    └── .env
```

#### 5. Configure Backend Environment

Create `public_html/api/.env`:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=your_hostinger_db_user
DB_PASSWORD=your_strong_db_password
DB_NAME=hospital_db
DB_PORT=3306

# Server Configuration
PORT=3000
NODE_ENV=production

# JWT Secret (MUST BE DIFFERENT FROM DEVELOPMENT!)
JWT_SECRET=generate_new_64_character_random_string_here

# Frontend URL (Your Domain)
FRONTEND_URL=https://yourdomain.com

# CORS Origins
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

**Generate Production Secrets:**
```bash
node generate-secrets.js
```

This will generate:
- JWT_SECRET (128 characters)
- SESSION_SECRET (128 characters)  
- DATABASE_PASSWORD (32 characters)

Copy these values to your production `.env` file.

#### 6. Install Dependencies & Start Backend

**SSH into Hostinger:**
```bash
ssh your_username@your_server_ip
cd public_html/api
```

**Install Dependencies:**
```bash
npm install --production
```

**Install PM2 (Process Manager):**
```bash
npm install -g pm2
```

**Start Backend:**
```bash
pm2 start src/server.js --name hospital-api
pm2 save
pm2 startup
```

**Check Status:**
```bash
pm2 status
pm2 logs hospital-api
```

#### 7. Configure Web Server

**For Apache (.htaccess):**

Create `public_html/.htaccess`:

```apache
# Enable Rewrite Engine
RewriteEngine On

# Force HTTPS
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

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
</IfModule>

# Disable Directory Listing
Options -Indexes
```

#### 8. Enable SSL Certificate

**In Hostinger Control Panel:**
1. Go to **SSL** section
2. Enable free SSL certificate
3. Wait 5-15 minutes for activation
4. Verify HTTPS works: `https://yourdomain.com`

#### 9. Test Deployment

**Test Backend API:**
```bash
curl https://yourdomain.com/api/health
```

**Test Frontend:**
Visit: `https://yourdomain.com`

**Test Login:**
- Email: `admin@hospital.com`
- Password: `admin123`

⚠️ **Change default password immediately!**

## 🔐 Security Checklist

Before going live:

- [ ] Changed default admin password
- [ ] Generated strong JWT_SECRET (64+ characters)
- [ ] Set strong database password
- [ ] Enabled HTTPS/SSL
- [ ] Updated CORS_ORIGINS to production domain only
- [ ] Set NODE_ENV=production
- [ ] Removed all test data
- [ ] Configured firewall rules
- [ ] Set up regular database backups
- [ ] Reviewed user permissions

## 📊 User Roles & Permissions

| Role | Permissions |
|------|------------|
| **Admin** | Full system access, user management, system settings |
| **Doctor** | Patient consultations, prescriptions, lab orders, medical records |
| **Nurse** | Patient care, vital signs, service delivery, medication administration |
| **Receptionist** | Patient registration, appointments, check-in/out, quick services, payments |
| **Pharmacist** | Medication management, prescription fulfillment, inventory |
| **Lab Technician** | Lab test management, result entry, test catalog |

## 🔧 Maintenance & Monitoring

### View Backend Logs
```bash
pm2 logs hospital-api
pm2 logs hospital-api --lines 100
pm2 logs hospital-api --err
```

### Restart Backend
```bash
pm2 restart hospital-api
```

### Stop Backend
```bash
pm2 stop hospital-api
```

### Check Status
```bash
pm2 status
pm2 monit
```

### Database Backup
```bash
# Create backup
mysqldump -u your_user -p hospital_db > backup_$(date +%Y%m%d).sql

# Restore backup
mysql -u your_user -p hospital_db < backup_20231118.sql
```

### Automated Daily Backups
```bash
# Edit crontab
crontab -e

# Add this line (runs daily at 2 AM)
0 2 * * * mysqldump -u your_user -p'your_password' hospital_db > /path/to/backups/hospital_$(date +\%Y\%m\%d).sql
```

## 🐛 Troubleshooting

### Backend Not Starting
```bash
# Check logs
pm2 logs hospital-api --err

# Check if port 3000 is in use
netstat -tulpn | grep 3000

# Restart
pm2 restart hospital-api
```

### Database Connection Error
- Verify credentials in `backend/.env`
- Check MySQL is running: `systemctl status mysql`
- Verify database exists: `mysql -u user -p -e "SHOW DATABASES;"`
- Check user permissions

### 502 Bad Gateway
- Backend not running: `pm2 restart hospital-api`
- Check `.htaccess` proxy configuration
- Verify port 3000 is accessible

### CORS Errors
- Update `CORS_ORIGINS` in `backend/.env`
- Restart backend: `pm2 restart hospital-api`
- Clear browser cache

### Login Not Working
- Verify JWT_SECRET is set in `.env`
- Check database has users table
- Verify password hash in database
- Check browser console for errors

### Appointments Not Showing
- Check appointment status (only 'Scheduled' and 'Confirmed' show in today's list)
- Verify appointment date matches today
- Check browser timezone settings

## 📱 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/logout` - User logout

### Patients
- `GET /api/patients` - List patients
- `POST /api/patients` - Create patient
- `GET /api/patients/:id` - Get patient
- `PUT /api/patients/:id` - Update patient
- `DELETE /api/patients/:id` - Delete patient

### Appointments
- `GET /api/appointments` - List appointments
- `POST /api/appointments` - Create appointment
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Delete appointment

### Medical Services
- `GET /api/services` - List services
- `POST /api/services` - Create service
- `PUT /api/services/:id` - Update service
- `DELETE /api/services/:id` - Delete service
- `POST /api/services/bulk` - Bulk import

### Patient Services
- `GET /api/patient-services` - List patient services
- `POST /api/patient-services` - Assign service
- `GET /api/patient-services/pending` - Pending services
- `PUT /api/patient-services/:id` - Update status

## 📄 License

Proprietary - All rights reserved

## 🆘 Support

For issues:
1. Check backend logs: `pm2 logs hospital-api`
2. Check browser console (F12)
3. Verify database connection
4. Review this README troubleshooting section

---

**Version:** 1.0.0  
**Last Updated:** November 2025  
**Status:** Production Ready ✅
