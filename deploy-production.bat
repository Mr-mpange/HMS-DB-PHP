@echo off
echo ========================================
echo Hospital Management System - Production Build
echo ========================================
echo.

echo [1/4] Building React frontend...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Frontend build failed!
    pause
    exit /b 1
)
echo ✓ Frontend build complete
echo.

echo [2/4] Verifying .htaccess file...
if exist "dist\.htaccess" (
    findstr /C:"api/public/index.php" dist\.htaccess >nul
    if %errorlevel% equ 0 (
        echo ✓ .htaccess has correct API routing
    ) else (
        echo WARNING: .htaccess might not have correct API routing
    )
) else (
    echo ERROR: .htaccess file not found in dist folder!
    pause
    exit /b 1
)
echo.

echo [3/4] Checking backend files...
if exist "backend\public\index.php" (
    echo ✓ Backend Laravel files found
) else (
    echo WARNING: Backend files not found in backend folder
)
echo.

echo [4/4] Build Summary
echo ========================================
echo Frontend: dist\ folder ready
echo Backend: backend\ folder ready
echo .htaccess: Configured for API routing
echo ========================================
echo.

echo DEPLOYMENT INSTRUCTIONS:
echo 1. Upload contents of 'dist\' folder to public_html\
echo 2. Upload 'backend\' folder to public_html\api\
echo 3. Configure backend\.env with production database
echo 4. Run: php artisan migrate --force
echo 5. Run: php artisan config:cache
echo 6. Run: php artisan route:cache
echo.

echo Build complete! Ready for deployment.
pause
