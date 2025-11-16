@echo off
REM Create Deployment Package for Hostinger (Windows)
REM This creates a ZIP file of only what you need to upload

echo ==========================================
echo Creating Deployment Package
echo ==========================================
echo.

REM Check if dist folder exists
if not exist dist (
    echo Error: dist folder not found
    echo Please build the project first:
    echo   build-production.bat
    exit /b 1
)

REM Create deployment folder
echo Step 1: Creating deployment folder...
if exist deployment-package rmdir /s /q deployment-package
mkdir deployment-package

REM Copy dist contents
echo Step 2: Copying built files...
xcopy /E /I /Y dist\* deployment-package\ >nul

REM Copy .htaccess
echo Step 3: Adding .htaccess...
if exist public\.htaccess (
    copy /Y public\.htaccess deployment-package\ >nul
) else (
    echo Warning: .htaccess not found
)

REM Create ZIP file (requires PowerShell)
echo Step 4: Creating ZIP file...
powershell -Command "Compress-Archive -Path deployment-package\* -DestinationPath hostinger-deployment.zip -Force"

REM Get file size
for %%A in (hostinger-deployment.zip) do set SIZE=%%~zA

echo.
echo ==========================================
echo Deployment Package Created!
echo ==========================================
echo.
echo File: hostinger-deployment.zip
echo Size: %SIZE% bytes
echo.
echo Next steps:
echo 1. Login to Hostinger hPanel
echo 2. Go to File Manager
echo 3. Navigate to public_html
echo 4. Upload hostinger-deployment.zip
echo 5. Extract it (right-click -^> Extract)
echo 6. Delete the zip file
echo.
echo Or use FTP to upload the files directly from deployment-package\
echo.

pause
