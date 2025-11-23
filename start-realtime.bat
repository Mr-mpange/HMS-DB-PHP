@echo off
echo ========================================
echo Starting Hospital Management System
echo with Real-Time Updates
echo ========================================
echo.

echo Installing Socket.io dependencies...
call npm install express socket.io cors
echo.

echo ========================================
echo Starting Socket.io Server...
echo ========================================
start "Socket Server" cmd /k "node socket-server.js"
timeout /t 3

echo ========================================
echo Starting Laravel Backend...
echo ========================================
start "Laravel Backend" cmd /k "cd backend && php artisan serve"
timeout /t 3

echo ========================================
echo Starting Frontend...
echo ========================================
start "Frontend" cmd /k "npm run dev"

echo.
echo ========================================
echo All services started!
echo ========================================
echo.
echo Socket Server: http://localhost:3000
echo Backend API: http://localhost:8000
echo Frontend: http://localhost:8080
echo.
echo Press any key to stop all services...
pause > nul

taskkill /FI "WindowTitle eq Socket Server*" /T /F
taskkill /FI "WindowTitle eq Laravel Backend*" /T /F
taskkill /FI "WindowTitle eq Frontend*" /T /F

echo All services stopped.
