@echo off
echo Seeding Insurance Companies...
php artisan db:seed --class=InsuranceCompaniesSeeder
echo Done!
pause
