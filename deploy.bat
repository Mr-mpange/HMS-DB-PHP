@echo off
echo ========================================
echo PRODUCTION DEPLOYMENT PACKAGE
echo Domain: hasetcompany.or.tz
echo ========================================
echo.

REM Clean up
echo [1/6] Cleaning up...
REM Only clean deployment folder - DO NOT delete files from node_modules!
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
copy /Y backend\database_schema.sql deployment\backend\

REM Create .env template (WITHOUT secrets)
echo # ============================================> deployment\backend\.env
echo # PRODUCTION ENVIRONMENT - hasetcompany.or.tz>> deployment\backend\.env
echo # REPLACE ALL VALUES BELOW WITH YOUR OWN!>> deployment\backend\.env
echo # ============================================>> deployment\backend\.env
echo.>> deployment\backend\.env
echo # Database Configuration>> deployment\backend\.env
echo DB_HOST=localhost>> deployment\backend\.env
echo DB_USER=hasetcompany_db_user>> deployment\backend\.env
echo DB_PASSWORD=REPLACE_WITH_YOUR_DB_PASSWORD>> deployment\backend\.env
echo DB_NAME=hasetcompany_hospital>> deployment\backend\.env
echo DB_PORT=3306>> deployment\backend\.env
echo.>> deployment\backend\.env
echo # Database Connection Pool>> deployment\backend\.env
echo DB_CONNECTION_LIMIT=10>> deployment\backend\.env
echo DB_QUEUE_LIMIT=0>> deployment\backend\.env
echo DB_ACQUIRE_TIMEOUT=60000>> deployment\backend\.env
echo DB_TIMEOUT=60000>> deployment\backend\.env
echo.>> deployment\backend\.env
echo # Server Configuration>> deployment\backend\.env
echo PORT=3000>> deployment\backend\.env
echo NODE_ENV=production>> deployment\backend\.env
echo.>> deployment\backend\.env
echo # Security (REPLACE WITH YOUR GENERATED SECRETS!)>> deployment\backend\.env
echo JWT_SECRET=REPLACE_WITH_YOUR_JWT_SECRET_FROM_production-secrets.txt>> deployment\backend\.env
echo SESSION_SECRET=REPLACE_WITH_YOUR_SESSION_SECRET_FROM_production-secrets.txt>> deployment\backend\.env
echo.>> deployment\backend\.env
echo # Domain Configuration>> deployment\backend\.env
echo FRONTEND_URL=https://hasetcompany.or.tz>> deployment\backend\.env
echo CORS_ORIGINS=https://hasetcompany.or.tz,https://www.hasetcompany.or.tz>> deployment\backend\.env
echo.>> deployment\backend\.env
echo # Rate Limiting>> deployment\backend\.env
echo RATE_LIMIT_WINDOW_MS=900000>> deployment\backend\.env
echo RATE_LIMIT_MAX_REQUESTS=100>> deployment\backend\.env

REM Copy configuration
copy /Y .htaccess deployment\frontend\
copy /Y README.md deployment\docs\
copy /Y DEPLOY_TO_HASETCOMPANY.txt deployment\docs\
copy /Y PRODUCTION_SETUP.md deployment\docs\

REM Copy secrets to docs (for your reference only - don't upload this folder!)
copy /Y production-secrets.txt deployment\docs\SECRETS_REFERENCE.txt

REM Create upload instructions
echo ========================================> deployment\UPLOAD_INSTRUCTIONS.txt
echo UPLOAD TO HOSTINGER>> deployment\UPLOAD_INSTRUCTIONS.txt
echo ========================================>> deployment\UPLOAD_INSTRUCTIONS.txt
echo.>> deployment\UPLOAD_INSTRUCTIONS.txt
echo ⚠️  IMPORTANT SECURITY NOTICE:>> deployment\UPLOAD_INSTRUCTIONS.txt
echo.>> deployment\UPLOAD_INSTRUCTIONS.txt
echo DO NOT UPLOAD THE 'docs' FOLDER!>> deployment\UPLOAD_INSTRUCTIONS.txt
echo It contains your secrets for reference only.>> deployment\UPLOAD_INSTRUCTIONS.txt
echo.>> deployment\UPLOAD_INSTRUCTIONS.txt
echo WHAT TO UPLOAD:>> deployment\UPLOAD_INSTRUCTIONS.txt
echo 1. Upload frontend/* to public_html/>> deployment\UPLOAD_INSTRUCTIONS.txt
echo 2. Upload backend/* to public_html/api/>> deployment\UPLOAD_INSTRUCTIONS.txt
echo.>> deployment\UPLOAD_INSTRUCTIONS.txt
echo AFTER UPLOAD:>> deployment\UPLOAD_INSTRUCTIONS.txt
echo 3. Edit public_html/api/.env on server>> deployment\UPLOAD_INSTRUCTIONS.txt
echo 4. Replace placeholders with your secrets>> deployment\UPLOAD_INSTRUCTIONS.txt
echo    (from docs/SECRETS_REFERENCE.txt)>> deployment\UPLOAD_INSTRUCTIONS.txt
echo 5. Follow docs/DEPLOY_TO_HASETCOMPANY.txt>> deployment\UPLOAD_INSTRUCTIONS.txt
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
echo   - frontend/     (UPLOAD to public_html/)
echo   - backend/      (UPLOAD to public_html/api/)
echo   - docs/         (REFERENCE ONLY - DO NOT UPLOAD!)
echo.
echo ⚠️  SECURITY NOTICE:
echo.
echo The backend/.env file has PLACEHOLDERS.
echo You MUST edit it on the server and add your secrets.
echo.
echo Your secrets are in: deployment/docs/SECRETS_REFERENCE.txt
echo (Keep this file secure - don't upload it!)
echo.
echo Next steps:
echo 1. Upload frontend/ and backend/ to Hostinger
echo 2. Edit public_html/api/.env on server
echo 3. Replace placeholders with your secrets
echo 4. Follow deployment/docs/DEPLOY_TO_HASETCOMPANY.txt
echo.
pause
