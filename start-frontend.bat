@echo off
REM Start Frontend Development Server
REM Hospital Management System

echo.
echo Starting Frontend Server...
echo =========================
echo.

echo Installing dependencies...
call npm install

echo.
echo Starting development server...
echo Frontend will run on: http://localhost:5173
echo.
echo Press Ctrl+C to stop the server
echo.

call npm run dev
