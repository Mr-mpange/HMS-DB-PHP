@echo off
REM Database Backup Script for Hospital Management System (Windows)

setlocal enabledelayedexpansion

REM Configuration
set BACKUP_DIR=backups\mysql
set DATE=%date:~-4%%date:~3,2%%date:~0,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set DATE=%DATE: =0%
set BACKUP_FILE=%BACKUP_DIR%\hospital_db_%DATE%.sql

REM Create backup directory
if not exist %BACKUP_DIR% mkdir %BACKUP_DIR%

echo Starting database backup...
echo Backup file: %BACKUP_FILE%

REM Check if using Docker
docker-compose ps >nul 2>&1
if %errorlevel% equ 0 (
    REM Docker deployment
    docker-compose exec -T mysql mysqldump -u root -p%DB_ROOT_PASSWORD% %DB_NAME% > %BACKUP_FILE%
) else (
    REM Manual deployment
    mysqldump -h %DB_HOST% -u %DB_USER% -p%DB_PASSWORD% %DB_NAME% > %BACKUP_FILE%
)

if errorlevel 1 (
    echo Error: Backup failed
    exit /b 1
)

REM Compress backup (requires 7-Zip or similar)
if exist "C:\Program Files\7-Zip\7z.exe" (
    "C:\Program Files\7-Zip\7z.exe" a -tgzip "%BACKUP_FILE%.gz" "%BACKUP_FILE%"
    del "%BACKUP_FILE%"
    echo Backup compressed: %BACKUP_FILE%.gz
) else (
    echo Warning: 7-Zip not found, backup not compressed
)

REM Remove old backups (older than 7 days)
forfiles /p %BACKUP_DIR% /s /m *.sql* /d -7 /c "cmd /c del @path" 2>nul

echo Backup completed successfully!
echo Location: %BACKUP_FILE%

pause
