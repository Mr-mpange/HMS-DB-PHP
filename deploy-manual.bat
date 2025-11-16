@echo off
REM Manual Deployment Script (Without Docker) - Windows
REM Hospital Management System

echo ==========================================
echo Hospital Management System
echo Manual Deployment (No Docker)
echo ==========================================
echo.

REM Check if .env exists
if not exist backend\.env (
    echo Error: backend\.env file not found
    echo Please copy backend\.env.production to backend\.env and configure it
    exit /b 1
)

REM Check Node.js
where node >nul 2>&1
if errorlevel 1 (
    echo Error: Node.js is not installed
    echo Please install Node.js 18+ from https://nodejs.org
    exit /b 1
)

echo Node.js found: 
node --version

REM Check MySQL
where mysql >nul 2>&1
if errorlevel 1 (
    echo Warning: MySQL command not found in PATH
    echo Make sure MySQL is installed and running
)

REM Navigate to backend
cd backend

echo.
echo Step 1: Installing dependencies...
call npm ci --only=production
if errorlevel 1 (
    echo Error installing dependencies
    exit /b 1
)

echo.
echo Step 2: Setting up database tables...
node setup-tables.js

echo.
echo Step 3: Creating admin user...
node create-admin.js

echo.
echo Step 4: Starting application...

REM Check if PM2 is installed
where pm2 >nul 2>&1
if errorlevel 1 (
    echo PM2 not found. Install it for better process management:
    echo   npm install -g pm2
    echo.
    echo Starting with Node.js directly...
    echo Note: This will run in foreground. Press Ctrl+C to stop.
    echo.
    set NODE_ENV=production
    node src/server.js
) else (
    echo Using PM2 process manager...
    pm2 start ecosystem.config.js --env production
    pm2 save
    echo.
    echo Application started with PM2
    echo.
    echo Useful PM2 commands:
    echo   - View status: pm2 status
    echo   - View logs: pm2 logs
    echo   - Restart: pm2 restart hospital-api
    echo   - Stop: pm2 stop hospital-api
)

echo.
echo ==========================================
echo Deployment Complete!
echo ==========================================
echo.
echo Services:
echo   - Backend API: http://localhost:3000
echo   - Health Check: http://localhost:3000/api/health
echo.
echo Default credentials:
echo   - Admin: admin@hospital.com / admin123
echo   - Doctor: doctor@hospital.com / doctor123
echo.
echo WARNING: Change default passwords after first login!
echo.

pause
