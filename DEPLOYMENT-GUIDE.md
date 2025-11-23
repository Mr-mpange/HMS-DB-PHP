# Hospital Management System - Deployment Guide

## 🚀 Quick Deployment

### For Windows Users:
```bash
# Double-click or run:
deploy.bat
```

### For Linux/Mac/Git Bash Users:
```bash
# Make executable and run:
chmod +x deploy.sh
./deploy.sh
```

### Manual PowerShell:
```powershell
powershell -ExecutionPolicy Bypass -File deploy.ps1
```

---

## 📦 What the Script Does

1. **Cleans up** old deployment folder
2. **Builds** React frontend (`npm run build`)
3. **Creates** deployment package structure
4. **Copies** frontend files to root
5. **Copies** Laravel backend to `api/` folder
6. **Creates** `.htaccess` for routing
7. **Generates** deployment instructions

---

## 📁 Output Structure

After running the script, you'll have:

```
complete-deploy/
├── index.html              # React frontend entry
├── assets/                 # Frontend JS/CSS
├── .htaccess              # Apache routing config
├── DEPLOY.txt             # Deployment instructions
├── README-FIRST.txt       # Quick start guide
└── api/                   # Laravel backend
    ├── app/
    ├── config/
    ├── database/
    ├── public/
    │   └── index.php      # Laravel entry point
    ├── routes/
    ├── .env.production    # Environment template
    └── ...
```

---

## 🌐 Hostinger Deployment Steps

### 1. Upload Files
- Compress `complete-deploy/` folder to ZIP
- Upload to Hostinger File Manager
- Extract to `public_html/`
- **OR** use FTP to upload all files directly

### 2. Configure Database
1. In Hostinger panel: **Databases** → **MySQL Databases**
2. Create new database (or use existing)
3. Note credentials:
   - Database name
   - Username
   - Password

### 3. Setup Environment
1. In File Manager: Navigate to `public_html/api/`
2. Rename `.env.production` to `.env`
3. Edit `.env` file:
   ```env
   DB_DATABASE=your_database_name
   DB_USERNAME=your_username
   DB_PASSWORD=your_password
   ```

### 4. Run Migrations (SSH Required)
```bash
# Connect via SSH
ssh your_username@your_server

# Navigate to Laravel directory
cd public_html/api

# Generate application key
php artisan key:generate

# Run migrations
php artisan migrate --force
```

This creates 21 database tables:
- users, patients, appointments, visits
- prescriptions, medications, lab_tests
- services, payments, invoices
- departments, activity_logs, and more

### 5. Create Admin User
```bash
# In SSH, run:
php artisan tinker

# Then paste:
\App\Models\User::create([
    'name' => 'Admin',
    'email' => 'admin@hasetcompany.or.tz',
    'password' => bcrypt('Admin@123'),
    'role' => 'admin',
    'is_active' => true
]);

# Press Ctrl+C to exit
```

### 6. Test Your Site
- **Frontend**: https://hasetcompany.or.tz
- **API Health**: https://hasetcompany.or.tz/api/health
- **Login**: admin@hasetcompany.or.tz / Admin@123

---

## 🔧 Troubleshooting

### Build Fails
```bash
# Install dependencies first
npm install

# Then try again
npm run build
```

### Permission Errors on Linux/Mac
```bash
# Make script executable
chmod +x deploy.sh

# Run with sudo if needed
sudo ./deploy.sh
```

### PowerShell Execution Policy Error
```powershell
# Run PowerShell as Administrator
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Then run deploy script
.\deploy.bat
```

### 500 Error on Hostinger
1. Check `.env` file exists and has correct database credentials
2. Check file permissions (755 for folders, 644 for files)
3. Check Laravel logs: `public_html/api/storage/logs/laravel.log`
4. Ensure `php artisan migrate` was run successfully

### Database Connection Error
1. Verify database exists in Hostinger panel
2. Check credentials in `.env` match exactly
3. Test connection:
   ```bash
   php artisan migrate:status
   ```

### Routes Not Working
1. Ensure `.htaccess` file exists in `public_html/`
2. Check Apache mod_rewrite is enabled
3. Contact Hostinger support if needed

---

## 📋 System Requirements

### Development:
- Node.js 18+
- npm or yarn
- Git (optional)

### Production (Hostinger):
- PHP 8.1+
- MySQL 5.7+
- Apache with mod_rewrite
- SSH access (for migrations)

---

## 🎯 Features Included

✅ **90+ API Endpoints**
- Authentication & Authorization
- Patient Management
- Appointment Scheduling
- Visit Workflow
- Prescriptions & Medications
- Lab Tests
- Billing & Invoicing
- Payment Processing (ZenoPay)
- Activity Logging
- Settings Management

✅ **8 User Roles**
- Admin
- Doctor
- Nurse
- Receptionist
- Lab Technician
- Pharmacist
- Billing Staff
- Patient

✅ **Complete Workflow**
- Reception → Doctor → Lab → Pharmacy → Billing → Discharge

---

## 🔐 Security Notes

1. **Change default admin password** after first login
2. **Update `.env`** with strong database password
3. **Configure ZenoPay** credentials for payment processing
4. **Enable HTTPS** (Hostinger provides free SSL)
5. **Regular backups** of database and files

---

## 📞 Support

### For Hostinger Support:
Tell them: *"I have a React SPA frontend in root (index.html) and Laravel API in /api/ subfolder. Frontend routes to /api/* should go to api/public/index.php. All other routes should serve index.html for React routing."*

### Documentation Files:
- `complete-deploy/README-FIRST.txt` - Quick start
- `complete-deploy/DEPLOY.txt` - Full instructions
- `complete-deploy/API-ENDPOINTS-VERIFIED.txt` - API documentation
- `complete-deploy/FINAL-DEPLOYMENT-CHECKLIST.txt` - Deployment checklist

---

## 🎉 Success!

Once deployed, you'll have a fully functional Hospital Management System with:
- Patient registration and management
- Appointment scheduling
- Electronic prescriptions
- Lab test management
- Pharmacy inventory
- Billing and invoicing
- Payment processing
- Activity logging
- Multi-role access control

**Default Login:**
- Email: admin@hasetcompany.or.tz
- Password: Admin@123

**Remember to change the password after first login!**

---

Last Updated: November 21, 2025
Version: 1.0
Status: Production Ready ✅
