@echo off
setlocal enabledelayedexpansion

REM Comprehensive Route Testing Script
echo ============================================
echo Hospital Management System - Route Testing
echo ============================================
echo.

set API_URL=http://localhost:3000/api
set ADMIN_EMAIL=admin@hospital.com
set ADMIN_PASSWORD=admin123

REM Create temp directory for responses
if not exist "test-results" mkdir test-results

echo [1/10] Testing Health Endpoint...
curl -s %API_URL%/health > test-results/health.json
type test-results\health.json
echo.
echo.

echo [2/10] Testing Authentication - Login...
curl -s -X POST %API_URL%/auth/login -H "Content-Type: application/json" -d "{\"email\":\"%ADMIN_EMAIL%\",\"password\":\"%ADMIN_PASSWORD%\"}" > test-results/login.json
type test-results\login.json
echo.

REM Extract token (manual step - user needs to set this)
echo.
echo ============================================
echo IMPORTANT: Extract the token from login.json
echo and set it as TOKEN variable:
echo   set TOKEN=your_token_here
echo Then press any key to continue testing...
echo ============================================
pause > nul

if "%TOKEN%"=="" (
    echo ERROR: TOKEN not set. Please set TOKEN variable and run again.
    exit /b 1
)

echo.
echo [3/10] Testing Patients Routes...
echo - GET /patients
curl -s %API_URL%/patients -H "Authorization: Bearer %TOKEN%" > test-results/patients-list.json
type test-results\patients-list.json
echo.

echo - POST /patients (Create)
curl -s -X POST %API_URL%/patients -H "Authorization: Bearer %TOKEN%" -H "Content-Type: application/json" -d "{\"first_name\":\"Test\",\"last_name\":\"Patient\",\"date_of_birth\":\"1990-01-01\",\"gender\":\"male\",\"phone\":\"1234567890\",\"email\":\"test@example.com\",\"address\":\"123 Test St\"}" > test-results/patient-create.json
type test-results\patient-create.json
echo.
echo.

echo [4/10] Testing Appointments Routes...
echo - GET /appointments
curl -s %API_URL%/appointments -H "Authorization: Bearer %TOKEN%" > test-results/appointments-list.json
type test-results\appointments-list.json
echo.
echo.

echo [5/10] Testing Prescriptions Routes...
echo - GET /prescriptions
curl -s %API_URL%/prescriptions -H "Authorization: Bearer %TOKEN%" > test-results/prescriptions-list.json
type test-results\prescriptions-list.json
echo.
echo.

echo [6/10] Testing Lab Tests Routes...
echo - GET /lab-tests
curl -s %API_URL%/lab-tests -H "Authorization: Bearer %TOKEN%" > test-results/lab-tests-list.json
type test-results\lab-tests-list.json
echo.
echo.

echo [7/10] Testing Pharmacy Routes...
echo - GET /pharmacy/medications
curl -s %API_URL%/pharmacy/medications -H "Authorization: Bearer %TOKEN%" > test-results/medications-list.json
type test-results\medications-list.json
echo.
echo.

echo [8/10] Testing Billing Routes...
echo - GET /billing/invoices
curl -s %API_URL%/billing/invoices -H "Authorization: Bearer %TOKEN%" > test-results/invoices-list.json
type test-results\invoices-list.json
echo.
echo.

echo [9/10] Testing Visits Routes...
echo - GET /visits
curl -s %API_URL%/visits -H "Authorization: Bearer %TOKEN%" > test-results/visits-list.json
type test-results\visits-list.json
echo.
echo.

echo [10/10] Testing Users Routes (Admin only)...
echo - GET /users
curl -s %API_URL%/users -H "Authorization: Bearer %TOKEN%" > test-results/users-list.json
type test-results\users-list.json
echo.
echo.

echo ============================================
echo Testing Complete!
echo Results saved in test-results/ directory
echo ============================================
echo.
echo Summary:
echo - Health: test-results\health.json
echo - Login: test-results\login.json
echo - Patients: test-results\patients-list.json
echo - Appointments: test-results\appointments-list.json
echo - Prescriptions: test-results\prescriptions-list.json
echo - Lab Tests: test-results\lab-tests-list.json
echo - Medications: test-results\medications-list.json
echo - Invoices: test-results\invoices-list.json
echo - Visits: test-results\visits-list.json
echo - Users: test-results\users-list.json
echo.

pause
