@echo off
REM Automated Route Testing Script for Windows
REM Tests all backend API endpoints

echo Testing Route Functionality...
echo.

set API_URL=http://localhost:3000/api
set ADMIN_EMAIL=admin@hospital.com
set ADMIN_PASSWORD=admin123

echo ============================================
echo 1. Testing Health Endpoint
echo ============================================
curl -s %API_URL%/health
echo.
echo.

echo ============================================
echo 2. Testing Authentication
echo ============================================
echo Logging in...
curl -s -X POST %API_URL%/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"%ADMIN_EMAIL%\",\"password\":\"%ADMIN_PASSWORD%\"}" > login_response.json

echo.
echo Login response saved to login_response.json
echo Please extract the token and set it manually:
echo   set TOKEN=your_token_here
echo.
echo Then run individual tests:
echo   curl %API_URL%/patients -H "Authorization: Bearer %%TOKEN%%"
echo.

pause
