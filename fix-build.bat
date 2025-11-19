@echo off
echo ========================================
echo FIXING BUILD - Reinstalling Dependencies
echo ========================================
echo.

echo Reinstalling node_modules...
rmdir /s /q node_modules 2>nul
npm install

echo.
echo Building frontend...
npm run build

if not exist dist\index.html (
    echo.
    echo ❌ Build failed! Check errors above.
    pause
    exit /b 1
)

echo.
echo ========================================
echo ✅ BUILD SUCCESSFUL!
echo ========================================
echo.
echo The dist/ folder is ready.
echo Now you can run deploy.bat to create the deployment package.
echo.
pause
