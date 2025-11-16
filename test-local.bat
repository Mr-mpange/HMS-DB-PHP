@echo off
REM Local Testing Script for Windows
REM Hospital Management System

echo.
echo Testing Local Development Environment
echo ========================================
echo.

set PASS=0
set FAIL=0

REM Check Node.js
echo Checking Prerequisites...
where node >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Node.js installed
    set /a PASS+=1
) else (
    echo [FAIL] Node.js not installed
    set /a FAIL+=1
)

REM Check npm
where npm >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] npm installed
    set /a PASS+=1
) else (
    echo [FAIL] npm not installed
    set /a FAIL+=1
)

REM Check MySQL
where mysql >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] MySQL client installed
    set /a PASS+=1
) else (
    echo [FAIL] MySQL client not installed
    set /a FAIL+=1
)

echo.
echo Checking Services...

REM Check backend
curl -s http://localhost:3000/health >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Backend is running (http://localhost:3000)
    set /a PASS+=1
) else (
    echo [FAIL] Backend is not running
    echo        Start with: cd backend ^&^& npm run dev
    set /a FAIL+=1
)

REM Check frontend
curl -s http://localhost:5173 >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Frontend is running (http://localhost:5173)
    set /a PASS+=1
) else (
    echo [FAIL] Frontend is not running
    echo        Start with: npm run dev
    set /a FAIL+=1
)

echo.
echo Checking Configuration...

REM Check backend .env
if exist backend\.env (
    echo [OK] Backend .env exists
    set /a PASS+=1
) else (
    echo [FAIL] Backend .env missing
    echo        Copy from backend\.env.example
    set /a FAIL+=1
)

REM Check frontend .env
if exist .env (
    echo [OK] Frontend .env exists
    set /a PASS+=1
) else (
    echo [FAIL] Frontend .env missing
    echo        Copy from .env.example
    set /a FAIL+=1
)

echo.
echo Checking Dependencies...

REM Check frontend dependencies
if exist node_modules (
    echo [OK] Frontend dependencies installed
    set /a PASS+=1
) else (
    echo [FAIL] Frontend dependencies not installed
    echo        Run: npm install
    set /a FAIL+=1
)

REM Check backend dependencies
if exist backend\node_modules (
    echo [OK] Backend dependencies installed
    set /a PASS+=1
) else (
    echo [FAIL] Backend dependencies not installed
    echo        Run: cd backend ^&^& npm install
    set /a FAIL+=1
)

echo.
echo ========================================
echo Test Summary
echo ========================================
echo Passed: %PASS%
echo Failed: %FAIL%
echo.

if %FAIL% equ 0 (
    echo [SUCCESS] Local environment is ready!
    echo.
    echo Next steps:
    echo 1. Open http://localhost:5173 in your browser
    echo 2. Test the application
    echo 3. Check console for any errors (F12)
    exit /b 0
) else (
    echo [ERROR] Some checks failed!
    echo.
    echo Fix the issues above, then run this script again.
    exit /b 1
)
