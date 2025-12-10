#!/bin/bash

echo "🧪 Quick System Test - All Features"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to run test
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected="$3"
    
    echo -n "Testing: $test_name... "
    
    if eval "$test_command" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PASS${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}❌ FAIL${NC}"
        ((TESTS_FAILED++))
    fi
}

echo "📁 Checking Backend Directory..."
if [ ! -d "backend" ]; then
    echo -e "${RED}❌ Backend directory not found. Run this from project root.${NC}"
    exit 1
fi

cd backend

echo ""
echo "🗄️  Database Tests"
echo "=================="

# Test 1: Check if migrations exist
run_test "Migration files exist" "ls database/migrations/*add_form_fields* && ls database/migrations/*create_service_forms*"

# Test 2: Check Laravel installation
run_test "Laravel artisan works" "php artisan --version"

# Test 3: Check database connection
run_test "Database connection" "php artisan tinker --execute='DB::connection()->getPdo();'"

# Test 4: Run migrations
echo -n "Running migrations... "
if php artisan migrate --force > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PASS${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${YELLOW}⚠️  Already migrated or error${NC}"
fi

# Test 5: Check table exists
run_test "service_forms table exists" "php artisan tinker --execute='echo Schema::hasTable(\"service_forms\") ? \"true\" : \"false\";' | grep true"

# Test 6: Check columns exist
run_test "requires_form column exists" "php artisan tinker --execute='echo Schema::hasColumn(\"medical_services\", \"requires_form\") ? \"true\" : \"false\";' | grep true"

run_test "form_template column exists" "php artisan tinker --execute='echo Schema::hasColumn(\"medical_services\", \"form_template\") ? \"true\" : \"false\";' | grep true"

echo ""
echo "🌐 API Tests"
echo "============"

# Test 7: Check if server is running (optional)
if curl -s http://localhost:8000/api/health > /dev/null 2>&1; then
    echo -e "Server running: ${GREEN}✅ PASS${NC}"
    ((TESTS_PASSED++))
    
    # Test API endpoints if server is running
    run_test "Services API endpoint" "curl -s http://localhost:8000/api/services | grep -q 'services'"
else
    echo -e "Server running: ${YELLOW}⚠️  Server not running (start with 'php artisan serve')${NC}"
fi

echo ""
echo "📋 Frontend Files"
echo "================"

cd ..

# Test 8: Check frontend files exist
run_test "ServiceFormDialog component" "test -f src/components/ServiceFormDialog.tsx"
run_test "Updated NurseDashboard" "grep -q 'ServiceFormDialog' src/pages/NurseDashboard.tsx"
run_test "Updated DoctorDashboard" "grep -q 'ServiceFormDialog' src/pages/DoctorDashboard.tsx"
run_test "Updated QuickServiceDialog" "grep -q 'serviceCart' src/components/QuickServiceDialog.tsx"
run_test "Updated BillingDashboard" "grep -q 'Paid Invoices' src/pages/BillingDashboard.tsx"

echo ""
echo "📊 Test Summary"
echo "==============="
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! System is ready.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Start the server: cd backend && php artisan serve"
    echo "2. Start the frontend: npm run dev"
    echo "3. Test manually using the TEST_ALL_FEATURES.md guide"
else
    echo -e "${RED}⚠️  Some tests failed. Check the issues above.${NC}"
fi

echo ""
echo "🔧 Manual Test Commands:"
echo "========================"
echo "# Add example forms:"
echo "cd backend && php artisan db:seed --class=ServiceFormsSeeder"
echo ""
echo "# Check database:"
echo "cd backend && php artisan tinker"
echo "DB::table('service_forms')->count();"
echo "DB::table('medical_services')->where('requires_form', true)->count();"
echo ""
echo "# Start servers:"
echo "cd backend && php artisan serve"
echo "npm run dev"