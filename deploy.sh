#!/bin/bash

# Hospital Management System - Deployment Script
# For Linux/Mac/Git Bash on Windows

set -e  # Exit on error

echo "========================================"
echo "HOSPITAL MANAGEMENT SYSTEM"
echo "Deployment Package Builder"
echo "========================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Clean up old deployment
echo -e "${YELLOW}[1/5] Cleaning up old deployment...${NC}"
if [ -d "complete-deploy" ]; then
    rm -rf complete-deploy
    echo -e "${GREEN}✓ Cleaned up old deployment${NC}"
fi

# Step 2: Build frontend
echo ""
echo -e "${YELLOW}[2/5] Building React frontend...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Frontend build failed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Frontend built successfully${NC}"

# Step 3: Create deployment directory
echo ""
echo -e "${YELLOW}[3/5] Creating deployment package...${NC}"
mkdir -p complete-deploy

# Copy frontend files to root
cp -r dist/* complete-deploy/
echo -e "${GREEN}✓ Copied frontend files${NC}"

# Copy Laravel backend to api folder
cp -r backend complete-deploy/api
echo -e "${GREEN}✓ Copied Laravel backend${NC}"

# Copy .env.production template
cp backend/.env.production complete-deploy/api/.env.production
echo -e "${GREEN}✓ Copied environment template${NC}"

# Step 4: Create .htaccess
echo ""
echo -e "${YELLOW}[4/5] Creating configuration files...${NC}"

cat > complete-deploy/.htaccess << 'EOF'
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}/%{REQUEST_URI} [L,R=301]

# API requests go to Laravel
RewriteRule ^api/(.*)$ api/public/index.php/$1 [L,QSA]

# Frontend - React SPA routing
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
EOF

echo -e "${GREEN}✓ Created .htaccess${NC}"

# Step 5: Create deployment instructions
cat > complete-deploy/DEPLOY.txt << 'EOF'
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
EOF

echo -e "${GREEN}✓ Created deployment instructions${NC}"

# Create README
cat > complete-deploy/README-FIRST.txt << 'EOF'
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
EOF

echo -e "${GREEN}✓ Created README${NC}"

# Summary
echo ""
echo "========================================"
echo -e "${GREEN}✅ DEPLOYMENT PACKAGE READY!${NC}"
echo "========================================"
echo ""
echo "Location: complete-deploy/"
echo ""
echo "Structure (CORRECT for Hostinger):"
echo "  complete-deploy/"
echo "  ├── index.html      (Frontend - goes to root)"
echo "  ├── assets/         (Frontend files)"
echo "  ├── .htaccess       (Routes API to Laravel)"
echo "  └── api/            (Laravel backend)"
echo "      └── public/"
echo "          └── index.php   (Laravel entry)"
echo ""
echo -e "${YELLOW}📖 Read: complete-deploy/README-FIRST.txt${NC}"
echo -e "${YELLOW}📖 Full instructions: complete-deploy/DEPLOY.txt${NC}"
echo ""
echo -e "${GREEN}Ready to upload to Hostinger!${NC}"
echo ""
