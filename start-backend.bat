@echo off
REM Start Backend Server
REM Hospital Management System

echo.
echo Starting Backend Server...
echo ========================
echo.

cd backend

echo Installing dependencies...
call npm install

echo.
echo Starting server...
echo Backend will run on: http://localhost:3000
echo.
echo Press Ctrl+C to stop the server
echo.

call npm start
