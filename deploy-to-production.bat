@echo off
echo ========================================
echo Hospital Management System
echo Production Deployment Script
echo ========================================
echo.

echo Step 1: Cleaning up...
cd backend
php artisan config:clear
php artisan route:clear
php artisan view:clear
cd ..

echo.
echo Step 2: Building frontend...
call npm run build

echo.
echo Step 3: Optimizing Laravel...
cd backend
php artisan config:cache
php artisan route:cache
php artisan view:cache
cd ..

echo.
echo ========================================
echo ✅ Production build complete!
echo ========================================
echo.
echo Next steps:
echo 1. Upload 'backend/' folder to your server
echo 2. Upload 'dist/' folder contents to web root
echo 3. Rename backend/.env.production to backend/.env
echo 4. Update .env with production credentials
echo 5. Run: php artisan migrate --force
echo 6. Run: php artisan db:seed
echo.
echo See PRODUCTION-DEPLOYMENT.md for detailed instructions
echo.
pause
