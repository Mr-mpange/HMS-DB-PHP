@echo off
echo ========================================
echo HOSTINGER DEPLOYMENT PACKAGE
echo ========================================
echo.

REM Clean up old deployment
if exist complete-deploy rmdir /s /q complete-deploy

REM Build frontend
echo [1/4] Building React frontend...
call npm run build
if errorlevel 1 (
    echo Failed to build frontend
    pause
    exit /b 1
)

REM Create deployment package
echo [2/4] Creating deployment package...
mkdir complete-deploy

REM Copy frontend to root
xcopy /E /I /Y dist\* complete-deploy\

REM Copy Laravel backend to api folder
echo [3/4] Copying Laravel backend...
xcopy /E /I /Y backend\* complete-deploy\api\

REM Copy .env.production template
copy /Y backend\.env.production complete-deploy\api\.env.production

REM Create main .htaccess for routing
echo [4/4] Creating configuration files...
(
echo RewriteEngine On
echo RewriteCond %%{HTTPS} off
echo RewriteRule ^^(.*)$ https://%%{HTTP_HOST}/%%{REQUEST_URI} [L,R=301]
echo.
echo # API requests go to Laravel
echo RewriteRule ^^api/(.*)$ api/public/index.php/$1 [L,QSA]
echo.
echo # Frontend - React SPA routing
echo RewriteCond %%{REQUEST_FILENAME} !-f
echo RewriteCond %%{REQUEST_FILENAME} !-d
echo RewriteRule . /index.html [L]
) > complete-deploy\.htaccess

REM Create deployment instructions
(
echo ========================================
echo HOSTINGER DEPLOYMENT INSTRUCTIONS
echo ========================================
echo.
echo STEP 1: Upload Files
echo -------------------
echo Upload ALL files from complete-deploy/ to public_html/
echo.
echo Final structure on server:
echo   public_html/
echo   ├── index.html          ^(Frontend entry^)
echo   ├── assets/             ^(Frontend files^)
echo   ├── .htaccess           ^(Routing^)
echo   └── api/                ^(Laravel backend^)
echo       ├── public/
echo       │   └── index.php   ^(Laravel entry^)
echo       ├── app/
echo       ├── config/
echo       └── .env.production ^(Rename to .env^)
echo.
echo STEP 2: Configure Database
echo ------------------------
echo 1. Create MySQL database in Hostinger panel
echo 2. Copy your database credentials
echo 3. In File Manager: public_html/api/
echo 4. Rename .env.production to .env
echo 5. Edit .env with your database info:
echo    DB_DATABASE=u232077031_hasetcompany
echo    DB_USERNAME=u232077031_hasetcompany
echo    DB_PASSWORD=your_password
echo.
echo STEP 3: Run Migrations
echo -----------------------
echo SSH into your server and run:
echo   cd public_html/api
echo   php artisan key:generate
echo   php artisan migrate --force
echo.
echo This creates all 19 database tables.
echo.
echo STEP 4: Create Admin User
echo -------------------------
echo   php artisan tinker
echo.
echo Then paste:
echo   \App\Models\User::create^(['id' =^> \Illuminate\Support\Str::uuid^(^), 'name' =^> 'Admin', 'email' =^> 'admin@hasetcompany.or.tz', 'password' =^> bcrypt^('Admin@123'^), 'role' =^> 'admin', 'is_active' =^> true]^);
echo.
echo STEP 5: Test
echo ------------
echo Frontend: https://hasetcompany.or.tz
echo API: https://hasetcompany.or.tz/api/health
echo Login: admin@hasetcompany.or.tz / Admin@123
echo.
echo ========================================
echo TELL HOSTINGER SUPPORT:
echo ========================================
echo "I have React frontend in root and Laravel API in /api/ subfolder"
echo "Frontend: public_html/index.html"
echo "Backend: public_html/api/public/index.php"
echo.
echo ========================================
) > complete-deploy\DEPLOY.txt

echo.
echo ========================================
echo ✅ DEPLOYMENT PACKAGE READY!
echo ========================================
echo.
echo Location: complete-deploy/
echo.
echo Structure ^(CORRECT for Hostinger^):
echo   complete-deploy/
echo   ├── index.html      ^(Frontend - goes to root^)
echo   ├── assets/         ^(Frontend files^)
echo   ├── .htaccess       ^(Routes API to Laravel^)
echo   └── api/            ^(Laravel backend^)
echo       └── public/
echo           └── index.php   ^(Laravel entry^)
echo.
echo ⚠️  IGNORE the "api" folder when uploading - 
echo     Upload ALL contents to public_html/
echo.
pause
