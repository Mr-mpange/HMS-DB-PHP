@echo off
echo ========================================
echo Building for Production
echo Domain: hasetcompany.or.tz
echo ========================================
echo.

echo [1/4] Cleaning previous builds...
if exist dist rmdir /s /q dist
if exist deployment rmdir /s /q deployment

echo [2/4] Installing dependencies...
call npm install

echo [3/4] Building frontend...
call npm run build

echo [4/4] Verifying build...
if exist dist\index.html (
    echo.
    echo ========================================
    echo ✅ BUILD SUCCESSFUL!
    echo ========================================
    echo.
    echo Build output: dist/
    echo.
    echo Next steps:
    echo 1. Run: deploy.bat
    echo 2. Upload deployment folder to Hostinger
    echo 3. Follow DEPLOY_TO_HASETCOMPANY.txt
    echo.
) else (
    echo.
    echo ========================================
    echo ❌ BUILD FAILED!
    echo ========================================
    echo.
    echo Check the error messages above.
    echo.
)

pause
