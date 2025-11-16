#!/bin/bash

# Automated Route Testing Script
# Tests all backend API endpoints

echo "🧪 Starting Route Testing..."
echo ""

# Configuration
API_URL="http://localhost:3000/api"
ADMIN_EMAIL="admin@hospital.com"
ADMIN_PASSWORD="admin123"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0

# Test function
test_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    local data=$4
    local expected_status=$5
    
    echo -n "Testing: $description... "
    
    if [ -z "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X $method "$API_URL$endpoint" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json")
    else
        response=$(curl -s -w "\n%{http_code}" -X $method "$API_URL$endpoint" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi
    
    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}✓ PASS${NC} (Status: $status_code)"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC} (Expected: $expected_status, Got: $status_code)"
        echo "Response: $body"
        ((FAILED++))
    fi
}

# Step 1: Test Health Endpoint
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. Testing Health Endpoint"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "GET" "/health" "Health check" "" "200"
echo ""

# Step 2: Test Authentication
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2. Testing Authentication"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo -n "Logging in... "
login_response=$(curl -s -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")

TOKEN=$(echo $login_response | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo -e "${RED}✗ FAIL${NC} - Could not get token"
    echo "Response: $login_response"
    exit 1
else
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASSED++))
fi

test_endpoint "GET" "/auth/me" "Get current user" "" "200"
echo ""

# Step 3: Test Patients
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3. Testing Patient Routes"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "GET" "/patients" "Get all patients" "" "200"
echo ""

# Step 4: Test Appointments
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4. Testing Appointment Routes"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "GET" "/appointments" "Get all appointments" "" "200"
echo ""

# Step 5: Test Prescriptions
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5. Testing Prescription Routes"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "GET" "/prescriptions" "Get all prescriptions" "" "200"
echo ""

# Step 6: Test Lab Tests
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "6. Testing Lab Routes"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "GET" "/labs" "Get all lab tests" "" "200"
echo ""

# Step 7: Test Pharmacy
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "7. Testing Pharmacy Routes"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "GET" "/pharmacy/medications" "Get all medications" "" "200"
test_endpoint "GET" "/pharmacy/medications/low-stock" "Get low stock" "" "200"
echo ""

# Step 8: Test Billing
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "8. Testing Billing Routes"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "GET" "/billing/invoices" "Get all invoices" "" "200"
test_endpoint "GET" "/billing/payments" "Get all payments" "" "200"
echo ""

# Step 9: Test Visits
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "9. Testing Visit Routes"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "GET" "/visits" "Get all visits" "" "200"
test_endpoint "GET" "/visits/stage/nurse" "Get visits by stage" "" "200"
echo ""

# Step 10: Test Users (Admin)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "10. Testing User Routes (Admin)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "GET" "/users" "Get all users" "" "200"
echo ""

# Step 11: Test Activity Logs (Admin)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "11. Testing Activity Routes (Admin)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "GET" "/activity" "Get activity logs" "" "200"
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Test Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo "Total: $((PASSED + FAILED))"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed!${NC}"
    exit 1
fi
