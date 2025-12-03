@echo off
echo ========================================
echo INSERTING LAB TEST DATA
echo ========================================
echo.

php quick-insert.php

echo.
echo ========================================
echo VERIFYING DATA
echo ========================================
php test-labs-api.php

echo.
echo ========================================
echo Press any key to close...
pause >nul
