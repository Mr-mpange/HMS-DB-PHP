@echo off
echo ========================================
echo CLEANING PROJECT FOR PRODUCTION
echo ========================================
echo.

echo Removing old backend-laravel folder...
if exist backend-laravel rmdir /s /q backend-laravel

echo Removing unnecessary .md files...
del /q CLEANUP_SUMMARY.md 2>nul
del /q CONVERSION_COMPLETE.md 2>nul
del /q FINAL_DEPLOYMENT_READY.md 2>nul
del /q LARAVEL_CONVERSION_STATUS.md 2>nul
del /q LARAVEL_DEPLOYMENT_GUIDE.md 2>nul
del /q PRODUCTION_CHECKLIST.md 2>nul
del /q PRODUCTION_DEPLOYMENT_CHECKLIST.md 2>nul
del /q PRODUCTION_READY_SUMMARY.md 2>nul
del /q PRODUCTION_SETUP.md 2>nul
del /q PROJECT_STRUCTURE.md 2>nul
del /q READY_TO_DEPLOY.md 2>nul
del /q ROUTE_TEST_RESULTS.md 2>nul
del /q ZENOPAY_INTEGRATION_GUIDE.md 2>nul

echo Removing unnecessary .txt files...
del /q BEFORE_DEPLOY.txt 2>nul
del /q DEPLOY_TO_HASETCOMPANY.txt 2>nul
del /q FINAL_CHECKLIST.txt 2>nul
del /q HOW_TO_DEPLOY.txt 2>nul
del /q PRODUCTION_COMPLETE.txt 2>nul
del /q PRODUCTION_READY.txt 2>nul
del /q SECURITY_NOTICE.txt 2>nul
del /q START_DEPLOYMENT.txt 2>nul
del /q START_HERE.txt 2>nul

echo Removing old deployment scripts...
del /q build-production.bat 2>nul
del /q deploy-hostinger.bat 2>nul
del /q deploy-laravel.bat 2>nul
del /q deploy.bat 2>nul
del /q deploy.sh 2>nul
del /q fix-build.bat 2>nul
del /q test-routes.bat 2>nul
del /q generate-secrets.cjs 2>nul

echo.
echo ========================================
echo ✅ CLEANUP COMPLETE!
echo ========================================
echo.
echo Remaining files:
echo - README.md (documentation)
echo - deploy-complete.bat (deployment)
echo - exclude-files.txt (deployment config)
echo - production-secrets.txt (your secrets)
echo - .env (frontend config)
echo - backend/.env.production (backend template)
echo.
echo Project is now clean and production-ready!
echo.
pause
