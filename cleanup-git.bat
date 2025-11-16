@echo off
REM Git Cleanup Script for Windows
REM Removes files that should be ignored but were accidentally committed

echo ==========================================
echo Git Repository Cleanup
echo ==========================================
echo.

echo This script will remove the following from git:
echo   - node_modules/
echo   - dist/
echo   - .env files (except templates)
echo   - deployment-package/
echo   - *.zip files
echo   - logs/
echo   - uploads/ (except .gitkeep)
echo   - backups/
echo.
echo WARNING: This will modify your git history!
echo Make sure you have a backup before proceeding.
echo.
set /p continue="Continue? (y/n): "
if /i not "%continue%"=="y" (
    echo Cancelled.
    exit /b 0
)

echo.
echo Removing files from git...

REM Remove node_modules
git ls-files | findstr "node_modules" >nul 2>&1
if %errorlevel% equ 0 (
    echo Removing node_modules...
    git rm -r --cached node_modules 2>nul
    git rm -r --cached backend\node_modules 2>nul
)

REM Remove dist
git ls-files | findstr "^dist/" >nul 2>&1
if %errorlevel% equ 0 (
    echo Removing dist...
    git rm -r --cached dist 2>nul
)

REM Remove .env files
git ls-files | findstr "\.env$" >nul 2>&1
if %errorlevel% equ 0 (
    echo Removing .env files...
    git rm --cached .env 2>nul
    git rm --cached backend\.env 2>nul
    git rm --cached .env.local 2>nul
    git rm --cached backend\.env.local 2>nul
)

REM Remove deployment artifacts
git ls-files | findstr "deployment-package" >nul 2>&1
if %errorlevel% equ 0 (
    echo Removing deployment-package...
    git rm -r --cached deployment-package 2>nul
)

git ls-files | findstr "\.zip$" >nul 2>&1
if %errorlevel% equ 0 (
    echo Removing .zip files...
    git rm --cached *.zip 2>nul
)

REM Remove logs
git ls-files | findstr "logs/" >nul 2>&1
if %errorlevel% equ 0 (
    echo Removing logs...
    git rm -r --cached logs 2>nul
    git rm -r --cached backend\logs 2>nul
)

REM Remove uploads
git ls-files | findstr "uploads/" >nul 2>&1
if %errorlevel% equ 0 (
    echo Removing uploads...
    git rm -r --cached backend\uploads 2>nul
    git add backend\uploads\.gitkeep 2>nul
)

REM Remove backups
git ls-files | findstr "backups/" >nul 2>&1
if %errorlevel% equ 0 (
    echo Removing backups...
    git rm -r --cached backups 2>nul
    git rm -r --cached backend\backups 2>nul
)

REM Remove test-results
git ls-files | findstr "test-results/" >nul 2>&1
if %errorlevel% equ 0 (
    echo Removing test-results...
    git rm -r --cached test-results 2>nul
)

echo.
echo Cleanup complete!
echo.
echo Next steps:
echo 1. Review changes: git status
echo 2. Commit changes: git commit -m "Remove ignored files from git"
echo 3. Push changes: git push
echo.
echo Note: If you committed secrets (.env files), regenerate them!
echo.

pause
