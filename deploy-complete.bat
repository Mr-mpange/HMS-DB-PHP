@echo off
echo ========================================
echo PRODUCTION DEPLOYMENT PACKAGE
echo Hospital Management System
echo ========================================
echo.

REM Stop if there are uncommitted changes
echo [1/5] Checking project status...

REM Clean up old deployment
if exist complete-deploy (
    echo Removing old deployment...
    rmdir /s /q complete-deploy
)

REM Build frontend
echo [2/5] Building frontend...
call npm run build

if not exist dist\index.html (
    echo.
    echo ❌ Frontend build failed!
    pause
    exit /b 1
)

REM Create deployment structure
echo [3/5] Creating deployment package...
mkdir complete-deploy

REM Copy frontend
echo [4/5] Copying files...
xcopy /E /I /Y dist\* complete-deploy\

REM Copy backend (excluding development files)
xcopy /E /I /Y backend complete-deploy\api\ /EXCLUDE:exclude-files.txt

REM Ensure .env.production is copied
copy /Y backend\.env.production complete-deploy\api\.env.production

REM Create deployment instructions
echo [5/5] Creating instructions...
echo ========================================> complete-deploy\DEPLOY.txt
echo DEPLOYMENT INSTRUCTIONS>> complete-deploy\DEPLOY.txt
echo ========================================>> complete-deploy\DEPLOY.txt
echo.>> complete-deploy\DEPLOY.txt
echo 1. Upload complete-deploy/* to public_html/>> complete-deploy\DEPLOY.txt
echo.>> complete-deploy\DEPLOY.txt
echo 2. Rename api/.env.production to api/.env>> complete-deploy\DEPLOY.txt
echo.>> complete-deploy\DEPLOY.txt
echo 3. Edit api/.env with your database credentials>> complete-deploy\DEPLOY.txt
echo.>> complete-deploy\DEPLOY.txt
echo 4. Run: cd public_html/api ^&^& php artisan key:generate>> complete-deploy\DEPLOY.txt
echo.>> complete-deploy\DEPLOY.txt
echo 5. Run: php artisan migrate --force>> complete-deploy\DEPLOY.txt
echo    (This creates all 19 database tables automatically)>> complete-deploy\DEPLOY.txt
echo.>> complete-deploy\DEPLOY.txt
echo 6. Create admin user:>> complete-deploy\DEPLOY.txt
echo    php artisan tinker>> complete-deploy\DEPLOY.txt
echo    Then paste:>> complete-deploy\DEPLOY.txt
echo    \App\Models\User::create(['id' =^> \Illuminate\Support\Str::uuid(),>> complete-deploy\DEPLOY.txt
echo    'name' =^> 'Admin', 'email' =^> 'admin@hasetcompany.or.tz',>> complete-deploy\DEPLOY.txt
echo    'password' =^> bcrypt('Admin@123'), 'role' =^> 'admin',>> complete-deploy\DEPLOY.txt
echo    'is_active' =^> true]);>> complete-deploy\DEPLOY.txt
echo.>> complete-deploy\DEPLOY.txt
echo 7. Visit your domain and login>> complete-deploy\DEPLOY.txt
echo.>> complete-deploy\DEPLOY.txt
echo ========================================>> complete-deploy\DEPLOY.txt

REM Copy essential documentation
copy /Y FINAL_DEPLOYMENT_READY.md complete-deploy\
copy /Y LARAVEL_DEPLOYMENT_GUIDE.md complete-deploy\

echo.
echo ========================================
echo ✅ DEPLOYMENT PACKAGE READY!
echo ========================================
echo.
echo Location: complete-deploy/
echo.
echo Next steps:
echo 1. Upload complete-deploy/* to your server
echo 2. Follow complete-deploy/DEPLOY.txt
echo.
echo ⚠️  SECURITY REMINDERS:
echo - Never commit .env files
echo - Change default passwords
echo - Use HTTPS in production
echo - Set up regular backups
echo.
pause
