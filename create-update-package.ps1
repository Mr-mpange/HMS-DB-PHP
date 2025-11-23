# Create Update Package for Hostinger
# Only includes changed files

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "CREATING UPDATE PACKAGE" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Create update folder
$updateFolder = "hostinger-update"
if (Test-Path $updateFolder) {
    Remove-Item -Recurse -Force $updateFolder
}
New-Item -ItemType Directory -Path $updateFolder | Out-Null

Write-Host "Creating update package with only changed files...`n" -ForegroundColor Yellow

# Create directory structure
New-Item -ItemType Directory -Path "$updateFolder/api/routes" -Force | Out-Null
New-Item -ItemType Directory -Path "$updateFolder/api/app/Http/Controllers" -Force | Out-Null
New-Item -ItemType Directory -Path "$updateFolder/api/app/Models" -Force | Out-Null
New-Item -ItemType Directory -Path "$updateFolder/api/database/migrations" -Force | Out-Null

# Copy updated backend files
Write-Host "Copying backend files..." -ForegroundColor Yellow

# Routes
Copy-Item "complete-deploy/api/routes/api.php" "$updateFolder/api/routes/api.php"
Write-Host "  ✓ routes/api.php" -ForegroundColor Green

# Controllers
Copy-Item "complete-deploy/api/app/Http/Controllers/AuthController.php" "$updateFolder/api/app/Http/Controllers/AuthController.php"
Write-Host "  ✓ AuthController.php (UPDATED)" -ForegroundColor Green

Copy-Item "complete-deploy/api/app/Http/Controllers/InvoiceController.php" "$updateFolder/api/app/Http/Controllers/InvoiceController.php"
Write-Host "  ✓ InvoiceController.php (NEW)" -ForegroundColor Green

Copy-Item "complete-deploy/api/app/Http/Controllers/LabTestController.php" "$updateFolder/api/app/Http/Controllers/LabTestController.php"
Write-Host "  ✓ LabTestController.php (NEW)" -ForegroundColor Green

# Models
Copy-Item "complete-deploy/api/app/Models/User.php" "$updateFolder/api/app/Models/User.php"
Write-Host "  ✓ User.php (UPDATED)" -ForegroundColor Green

Copy-Item "complete-deploy/api/app/Models/Setting.php" "$updateFolder/api/app/Models/Setting.php"
Write-Host "  ✓ Setting.php (NEW)" -ForegroundColor Green

Copy-Item "complete-deploy/api/app/Models/DepartmentFee.php" "$updateFolder/api/app/Models/DepartmentFee.php"
Write-Host "  ✓ DepartmentFee.php (NEW)" -ForegroundColor Green

Copy-Item "complete-deploy/api/app/Models/InsuranceCompany.php" "$updateFolder/api/app/Models/InsuranceCompany.php"
Write-Host "  ✓ InsuranceCompany.php (NEW)" -ForegroundColor Green

# Migrations
Copy-Item "complete-deploy/api/database/migrations/2024_01_01_000001_create_hospital_tables.php" "$updateFolder/api/database/migrations/2024_01_01_000001_create_hospital_tables.php"
Write-Host "  ✓ create_hospital_tables.php (UPDATED)" -ForegroundColor Green

# Copy frontend if it exists
if (Test-Path "complete-deploy/index.html") {
    Write-Host "`nCopying frontend files..." -ForegroundColor Yellow
    Copy-Item "complete-deploy/index.html" "$updateFolder/index.html"
    Write-Host "  ✓ index.html" -ForegroundColor Green
    
    if (Test-Path "complete-deploy/assets") {
        Copy-Item "complete-deploy/assets" "$updateFolder/assets" -Recurse
        Write-Host "  ✓ assets/ folder" -ForegroundColor Green
    }
}

# Create update instructions
$instructions = @"
🔄 HOSTINGER UPDATE INSTRUCTIONS
=================================

WHAT'S IN THIS PACKAGE:
-----------------------

Backend Files (upload to public_html/api/):
✅ routes/api.php
✅ app/Http/Controllers/AuthController.php (UPDATED)
✅ app/Http/Controllers/InvoiceController.php (NEW)
✅ app/Http/Controllers/LabTestController.php (NEW)
✅ app/Models/User.php (UPDATED)
✅ app/Models/Setting.php (NEW)
✅ app/Models/DepartmentFee.php (NEW)
✅ app/Models/InsuranceCompany.php (NEW)
✅ database/migrations/2024_01_01_000001_create_hospital_tables.php (UPDATED)

Frontend Files (upload to public_html/):
✅ index.html (if included)
✅ assets/ (if included)

HOW TO UPDATE:
--------------

1. BACKUP FIRST!
   Download your current public_html/api/.env file

2. UPLOAD FILES:
   Via Hostinger File Manager or FTP:
   - Upload api/ folder contents to public_html/api/
   - Upload index.html and assets/ to public_html/ (if included)

3. RUN MIGRATIONS (SSH):
   cd public_html/api
   php artisan migrate --force

4. CLEAR CACHE (SSH):
   php artisan config:clear
   php artisan cache:clear
   php artisan route:clear

5. TEST:
   Visit: https://hasetcompany.or.tz/api/health
   Login: https://hasetcompany.or.tz

WHAT'S NEW:
-----------

✅ 90+ API endpoints (was ~75)
✅ Activity logs system
✅ Pharmacy medications management
✅ Lab tests alternative endpoints
✅ Consultations workflow
✅ Prescriptions batch creation
✅ Patient search
✅ Settings management
✅ Department fees
✅ User role assignment
✅ All missing routes added

VERIFICATION:
-------------

After update, test these new endpoints:
- GET /api/activity
- GET /api/pharmacy/medications
- GET /api/labs
- GET /api/settings/consultation_fee
- POST /api/consultations
- POST /api/prescriptions/batch
- GET /api/patients/search?query=john

All should work without errors.

ROLLBACK:
---------

If something goes wrong:
1. Restore your backed up .env
2. Re-upload your previous files
3. Run: php artisan migrate:rollback
4. Then: php artisan migrate

SUPPORT:
--------

Check Laravel logs if errors occur:
public_html/api/storage/logs/laravel.log

Generated: November 21, 2025
"@

Set-Content -Path "$updateFolder/UPDATE-INSTRUCTIONS.txt" -Value $instructions
Write-Host "`n  ✓ UPDATE-INSTRUCTIONS.txt" -ForegroundColor Green

# Create file list
$fileList = @"
FILES IN THIS UPDATE PACKAGE
=============================

Backend (api/):
  routes/
    └── api.php

  app/Http/Controllers/
    ├── AuthController.php (UPDATED)
    ├── InvoiceController.php (NEW)
    └── LabTestController.php (NEW)

  app/Models/
    ├── User.php (UPDATED)
    ├── Setting.php (NEW)
    ├── DepartmentFee.php (NEW)
    └── InsuranceCompany.php (NEW)

  database/migrations/
    └── 2024_01_01_000001_create_hospital_tables.php (UPDATED)

Frontend (if included):
  index.html
  assets/

Total Files: 9 backend + 2 frontend (if included)
"@

Set-Content -Path "$updateFolder/FILE-LIST.txt" -Value $fileList

# Summary
Write-Host "`n========================================" -ForegroundColor Green
Write-Host "✅ UPDATE PACKAGE CREATED!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

Write-Host "Location: $updateFolder/`n"
Write-Host "Files included:" -ForegroundColor Yellow
Write-Host "  • 1 routes file"
Write-Host "  • 3 controllers (1 updated, 2 new)"
Write-Host "  • 4 models (1 updated, 3 new)"
Write-Host "  • 1 migration file"
if (Test-Path "$updateFolder/index.html") {
    Write-Host "  • Frontend files (index.html + assets/)"
}

Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "  1. Read: $updateFolder/UPDATE-INSTRUCTIONS.txt"
Write-Host "  2. Backup your .env file on Hostinger"
Write-Host "  3. Upload files to Hostinger"
Write-Host "  4. Run migrations via SSH"
Write-Host "  5. Clear cache via SSH"
Write-Host "  6. Test your site`n"

Write-Host "Ready to upload to Hostinger! 🚀`n" -ForegroundColor Green
