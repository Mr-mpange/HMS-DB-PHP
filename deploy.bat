@echo off
echo ========================================
echo PRODUCTION DEPLOYMENT PACKAGE
echo Domain: hasetcompany.or.tz
echo ========================================
echo.

REM Clean up
echo [1/6] Cleaning up...
del /s /q *.test.* 2>nul
del /s /q test-*.js 2>nul
del /s /q check-*.js 2>nul
if exist deployment rmdir /s /q deployment

REM Build frontend
echo [2/6] Building frontend...
call npm install
call npm run build

REM Install backend
echo [3/6] Preparing backend...
cd backend
call npm install --production
cd ..

REM Create deployment structure
echo [4/6] Creating deployment package...
mkdir deployment
mkdir deployment\frontend
mkdir deployment\backend
mkdir deployment\backend\src
mkdir deployment\docs

REM Copy frontend
echo [5/6] Copying files...
xcopy /E /I /Y dist\* deployment\frontend\

REM Copy backend
xcopy /E /I /Y backend\src deployment\backend\src\
copy /Y backend\package.json deployment\backend\
copy /Y backend\package-lock.json deployment\backend\
copy /Y backend\.env.production deployment\backend\.env
copy /Y backend\database_schema.sql deployment\backend\

REM Copy configuration
copy /Y .htaccess deployment\frontend\
copy /Y README.md deployment\docs\
copy /Y DEPLOY_TO_HASETCOMPANY.txt deployment\docs\
copy /Y PRODUCTION_SETUP.md deployment\docs\
copy /Y production-secrets.txt deployment\docs\

REM Create upload instructions
echo ========================================> deployment\UPLOAD_INSTRUCTIONS.txt
echo UPLOAD TO HOSTINGER>> deployment\UPLOAD_INSTRUCTIONS.txt
echo ========================================>> deployment\UPLOAD_INSTRUCTIONS.txt
echo.>> deployment\UPLOAD_INSTRUCTIONS.txt
echo 1. Upload frontend/* to public_html/>> deployment\UPLOAD_INSTRUCTIONS.txt
echo 2. Upload backend/* to public_html/api/>> deployment\UPLOAD_INSTRUCTIONS.txt
echo 3. Follow docs/DEPLOY_TO_HASETCOMPANY.txt>> deployment\UPLOAD_INSTRUCTIONS.txt
echo.>> deployment\UPLOAD_INSTRUCTIONS.txt
echo Domain: hasetcompany.or.tz>> deployment\UPLOAD_INSTRUCTIONS.txt
echo ========================================>> deployment\UPLOAD_INSTRUCTIONS.txt

echo [6/6] Finalizing...
echo.
echo ========================================
echo ✅ DEPLOYMENT PACKAGE READY!
echo ========================================
echo.
echo Package location: deployment/
echo.
echo Contents:
echo   - frontend/     (Upload to public_html/)
echo   - backend/      (Upload to public_html/api/)
echo   - docs/         (Reference documentation)
echo.
echo Next steps:
echo 1. Compress 'deployment' folder to ZIP
echo 2. Upload to Hostinger
echo 3. Follow docs/DEPLOY_TO_HASETCOMPANY.txt
echo.
echo Secrets saved in: production-secrets.txt
echo ⚠️  Keep this file secure!
echo.
pause
