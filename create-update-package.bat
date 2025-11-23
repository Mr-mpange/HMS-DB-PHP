@echo off
REM Create Update Package for Hostinger

echo ========================================
echo CREATING UPDATE PACKAGE
echo ========================================
echo.

powershell -ExecutionPolicy Bypass -File "%~dp0create-update-package.ps1"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Failed to create update package!
    pause
    exit /b 1
)

echo.
pause
