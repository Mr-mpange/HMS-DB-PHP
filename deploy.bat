@echo off
REM Hospital Management System - Production Deployment Script for Windows

echo ==========================================
echo Hospital Management System Deployment
echo ==========================================
echo.

REM Check if .env file exists
if not exist .env (
    echo Error: .env file not found
    echo Please copy .env.production to .env and configure it
    exit /b 1
)

echo Step 1: Building Docker images...
docker-compose build
if errorlevel 1 (
    echo Error building Docker images
    exit /b 1
)

echo.
echo Step 2: Starting services...
docker-compose up -d
if errorlevel 1 (
    echo Error starting services
    exit /b 1
)

echo.
echo Step 3: Waiting for MySQL to be ready...
timeout /t 10 /nobreak > nul

echo.
echo Step 4: Setting up database tables...
docker-compose exec backend node setup-tables.js

echo.
echo Step 5: Creating admin user...
docker-compose exec backend node create-admin.js

echo.
echo ==========================================
echo Deployment Complete!
echo ==========================================
echo.
echo Services:
echo   - Backend API: http://localhost:3000
echo   - MySQL: localhost:3306
echo   - Nginx: http://localhost:80
echo.
echo Default credentials:
echo   - Admin: admin@hospital.com / admin123
echo   - Doctor: doctor@hospital.com / doctor123
echo.
echo Useful commands:
echo   - View logs: docker-compose logs -f
echo   - Stop services: docker-compose down
echo   - Restart: docker-compose restart
echo.

pause
