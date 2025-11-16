@echo off
echo.
echo Testing Backend Connection...
echo ============================
echo.

curl -s http://localhost:3000/health

if %errorlevel% equ 0 (
    echo.
    echo [SUCCESS] Backend is running!
    echo.
) else (
    echo.
    echo [ERROR] Backend is NOT running!
    echo.
    echo Please start the backend:
    echo   cd backend
    echo   npm start
    echo.
)

pause
