# Hospital Management System - Deployment Script
# PowerShell version for Windows

$ErrorActionPreference = "Stop"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "HOSPITAL MANAGEMENT SYSTEM" -ForegroundColor Cyan
Write-Host "Deployment Package Builder" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Step 1: Clean up old deployment
Write-Host "[1/5] Cleaning up old deployment..." -ForegroundColor Yellow
if (Test-Path "complete-deploy") {
    Remove-Item -Recurse -Force complete-deploy
    Write-Host "✓ Cleaned up old deployment" -ForegroundColor Green
}

# Step 2: Build frontend
Write-Host "`n[2/5] Building React frontend..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Frontend build failed" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Frontend built successfully" -ForegroundColor Green

# Step 3: Create deployment directory
Write-Host "`n[3/5] Creating deployment package..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path "complete-deploy" -Force | Out-Null

# Copy frontend files to root
Copy-Item -Path "dist\*" -Destination "complete-deploy\" -Recurse -Force
Write-Host "✓ Copied frontend files" -ForegroundColor Green

# Copy Laravel backend to api folder
Copy-Item -Path "backend" -Destination "complete-deploy\api" -Recurse -Force
Write-Host "✓ Copied Laravel backend" -ForegroundColor Green

# Copy .env.production template
Copy-Item -Path "backend\.env.production" -Destination "complete-deploy\api\.env.production" -Force
Write-Host "✓ Copied environment template" -ForegroundColor Green

# Step 4: Create .htaccess
Write-Host "`n[4/5] Creating configuration files..." -ForegroundColor Yellow

$htaccessContent = @"
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}/%{REQUEST_URI} [L,R=301]

# API requests go to Laravel
RewriteRule ^api/(.*)$ api/public/index.php/$1 [L,QSA]

# Frontend - React SPA routing
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
"@

Set-Content -Path "complete-deploy\.htaccess" -Value $htaccessContent
Write-Host "✓ Created .htaccess" -ForegroundColor Green

# Step 5: Create deployment instructions
$deployContent = @"
========================================
HOSTINGER DEPLOYMENT INSTRUCTIONS
========================================

STEP 1: Upload Files
-------------------
Upload ALL files from complete-deploy/ to public_html/

Final structure on server:
  public_html/
  ├── index.html          (Frontend entry)
  ├── assets/             (Frontend files)
  ├── .htaccess           (Routing)
  └── api/                (Laravel backend)
      ├── public/
      │   └── index.php   (Laravel entry)
      ├── app/
      ├── config/
      └── .env.production (Rename to .env)

STEP 2: Configure Database
------------------------
1. Create MySQL database in Hostinger panel
2. Copy your database credentials
3. In File Manager: public_html/api/
4. Rename .env.production to .env
5. Edit .env with your database info:
   DB_DATABASE=u232077031_hasetcompany
   DB_USERNAME=u232077031_hasetcompany
   DB_PASSWORD=your_password

STEP 3: Run Migrations
-----------------------
SSH into your server and run:
  cd public_html/api
  php artisan key:generate
  php artisan migrate --force

This creates all 21 database tables.

STEP 4: Create Admin User
-------------------------
  php artisan tinker

Then paste:
  \App\Models\User::create(['name' => 'Admin', 'email' => 'admin@hasetcompany.or.tz', 'password' => bcrypt('Admin@123'), 'role' => 'admin', 'is_active' => true]);

Press Ctrl+C to exit tinker

STEP 5: Test
------------
Frontend: https://hasetcompany.or.tz
API: https://hasetcompany.or.tz/api/health
Login: admin@hasetcompany.or.tz / Admin@123

========================================
TELL HOSTINGER SUPPORT:
========================================
"I have React frontend in root and Laravel API in /api/ subfolder"
"Frontend: public_html/index.html"
"Backend: public_html/api/public/index.php"

========================================
"@

Set-Content -Path "complete-deploy\DEPLOY.txt" -Value $deployContent
Write-Host "✓ Created deployment instructions" -ForegroundColor Green

# Create README
$readmeContent = @"
✅ DEPLOYMENT PACKAGE READY FOR HOSTINGER!
==========================================

📦 What's in this folder:
- index.html + assets/     → React frontend (goes to root)
- api/                     → Laravel backend (subfolder)
- .htaccess                → Routes API requests to Laravel
- DEPLOY.txt               → Full deployment instructions

🚀 QUICK START:
1. Upload ALL files to public_html/ on Hostinger
2. Rename api/.env.production to api/.env
3. Edit api/.env with your MySQL credentials
4. SSH: cd public_html/api && php artisan migrate --force
5. Create admin user (see DEPLOY.txt)

🌐 Your site will be live at: https://hasetcompany.or.tz

📖 Read DEPLOY.txt for complete step-by-step instructions.
"@

Set-Content -Path "complete-deploy\README-FIRST.txt" -Value $readmeContent
Write-Host "✓ Created README" -ForegroundColor Green

# Summary
Write-Host "`n========================================" -ForegroundColor Green
Write-Host "✅ DEPLOYMENT PACKAGE READY!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

Write-Host "Location: complete-deploy/`n"
Write-Host "Structure (CORRECT for Hostinger):"
Write-Host "  complete-deploy/"
Write-Host "  ├── index.html      (Frontend - goes to root)"
Write-Host "  ├── assets/         (Frontend files)"
Write-Host "  ├── .htaccess       (Routes API to Laravel)"
Write-Host "  └── api/            (Laravel backend)"
Write-Host "      └── public/"
Write-Host "          └── index.php   (Laravel entry)`n"

Write-Host "📖 Read: complete-deploy/README-FIRST.txt" -ForegroundColor Yellow
Write-Host "📖 Full instructions: complete-deploy/DEPLOY.txt`n" -ForegroundColor Yellow

Write-Host "Ready to upload to Hostinger!`n" -ForegroundColor Green
