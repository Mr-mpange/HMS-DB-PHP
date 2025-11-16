@echo off
REM Production Build Script for Windows
REM This script builds the frontend for production deployment

echo ==========================================
echo Building for Production
echo ==========================================
echo.

REM Check if .env.production exists
if not exist .env.production (
    echo Error: .env.production not found
    echo Please create .env.production with your production settings
    exit /b 1
)

REM Check if backend URL is configured
findstr /C:"your-backend-url" .env.production >nul
if %errorlevel% equ 0 (
    echo Warning: Backend URL not configured in .env.production
    echo Please update VITE_API_URL with your actual backend URL
    set /p continue="Continue anyway? (y/n): "
    if /i not "%continue%"=="y" exit /b 1
)

echo Step 1: Installing dependencies...
call npm ci
if errorlevel 1 (
    echo Error installing dependencies
    exit /b 1
)

echo.
echo Step 2: Running type check...
call npm run type-check

echo.
echo Step 3: Building production bundle...
call npm run build:prod
if errorlevel 1 (
    echo Error building production bundle
    exit /b 1
)

echo.
echo ==========================================
echo Build Complete!
echo ==========================================
echo.
echo Output directory: dist\
echo.
echo Next steps:
echo 1. Upload 'dist' folder to Hostinger
echo 2. Configure .htaccess for React Router
echo 3. Enable SSL certificate
echo.
echo Files to upload:
dir /b dist\
echo.

pause
