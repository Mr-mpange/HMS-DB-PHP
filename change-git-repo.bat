@echo off
echo ========================================
echo CHANGE GIT REPOSITORY
echo ========================================
echo.
echo Current repository: https://github.com/Mr-mpange/HMS-DB.git
echo.
set /p NEW_REPO="Enter your NEW repository URL: "
echo.
echo Changing remote to: %NEW_REPO%
git remote set-url origin %NEW_REPO%
echo.
echo ✅ Repository changed!
echo.
echo Verifying...
git remote -v
echo.
echo ========================================
echo Ready to push to new repository!
echo ========================================
echo.
echo Run these commands:
echo   git add .
echo   git commit -m "Initial commit"
echo   git push -u origin main
echo.
pause
