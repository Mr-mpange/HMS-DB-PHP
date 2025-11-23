@echo off
REM Hospital Management System - Deployment Script
REM Windows Batch File

echo ========================================
echo HOSPITAL MANAGEMENT SYSTEM
echo Deployment Package Builder
echo ========================================
echo.

REM Run the PowerShell script
powershell -ExecutionPolicy Bypass -File "%~dp0deploy.ps1"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Deployment failed!
    pause
    exit /b 1
)

echo.
pause
