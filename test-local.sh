#!/bin/bash

# Local Testing Script
# Hospital Management System

echo "🧪 Testing Local Development Environment"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASS=0
FAIL=0

check_pass() {
    echo -e "${GREEN}✓ $1${NC}"
    ((PASS++))
}

check_fail() {
    echo -e "${RED}✗ $1${NC}"
    ((FAIL++))
}

# Check Node.js
echo "📦 Checking Prerequisites..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    check_pass "Node.js installed ($NODE_VERSION)"
else
    check_fail "Node.js not installed"
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    check_pass "npm installed ($NPM_VERSION)"
else
    check_fail "npm not installed"
fi

# Check MySQL
if command -v mysql &> /dev/null; then
    check_pass "MySQL client installed"
else
    check_fail "MySQL client not installed"
fi
echo ""

# Check if backend is running
echo "🔍 Checking Services..."
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    check_pass "Backend is running (http://localhost:3000)"
else
    check_fail "Backend is not running (http://localhost:3000)"
    echo "   Start with: cd backend && npm run dev"
fi

# Check if frontend is running
if curl -s http://localhost:5173 > /dev/null 2>&1; then
    check_pass "Frontend is running (http://localhost:5173)"
else
    check_fail "Frontend is not running (http://localhost:5173)"
    echo "   Start with: npm run dev"
fi
echo ""

# Check environment files
echo "⚙️  Checking Configuration..."
if [ -f backend/.env ]; then
    check_pass "Backend .env exists"
else
    check_fail "Backend .env missing (copy from .env.example)"
fi

if [ -f .env ]; then
    check_pass "Frontend .env exists"
else
    check_fail "Frontend .env missing (copy from .env.example)"
fi
echo ""

# Check dependencies
echo "📚 Checking Dependencies..."
if [ -d node_modules ]; then
    check_pass "Frontend dependencies installed"
else
    check_fail "Frontend dependencies not installed (run: npm install)"
fi

if [ -d backend/node_modules ]; then
    check_pass "Backend dependencies installed"
else
    check_fail "Backend dependencies not installed (run: cd backend && npm install)"
fi
echo ""

# Summary
echo "========================================"
echo "📊 Test Summary"
echo "========================================"
echo -e "${GREEN}Passed: $PASS${NC}"
echo -e "${RED}Failed: $FAIL${NC}"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}✅ Local environment is ready!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Open http://localhost:5173 in your browser"
    echo "2. Test the application"
    echo "3. Check console for any errors (F12)"
    exit 0
else
    echo -e "${RED}❌ Some checks failed!${NC}"
    echo ""
    echo "Fix the issues above, then run this script again."
    exit 1
fi
