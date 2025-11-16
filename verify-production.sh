#!/bin/bash

# Production Readiness Verification Script
# Hospital Management System

echo "🔍 Verifying Production Readiness..."
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASS=0
FAIL=0
WARN=0

check_pass() {
    echo -e "${GREEN}✓ $1${NC}"
    ((PASS++))
}

check_fail() {
    echo -e "${RED}✗ $1${NC}"
    ((FAIL++))
}

check_warn() {
    echo -e "${YELLOW}⚠ $1${NC}"
    ((WARN++))
}

# Check environment files
echo "📋 Checking Environment Files..."
if [ -f .env.production ]; then
    check_pass "Frontend .env.production exists"
else
    check_fail "Frontend .env.production missing"
fi

if [ -f backend/.env.production ]; then
    check_pass "Backend .env.production exists"
else
    check_fail "Backend .env.production missing"
fi
echo ""

# Check configuration files
echo "⚙️  Checking Configuration Files..."
[ -f nginx.conf ] && check_pass "nginx.conf exists" || check_fail "nginx.conf missing"
[ -f ecosystem.config.js ] && check_pass "ecosystem.config.js exists" || check_fail "ecosystem.config.js missing"
[ -f Dockerfile ] && check_pass "Dockerfile exists" || check_fail "Dockerfile missing"
[ -f backend/Dockerfile ] && check_pass "Backend Dockerfile exists" || check_fail "Backend Dockerfile missing"
[ -f docker-compose.prod.yml ] && check_pass "docker-compose.prod.yml exists" || check_fail "docker-compose.prod.yml missing"
echo ""

# Check Node.js and npm
echo "🔧 Checking Prerequisites..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    check_pass "Node.js installed ($NODE_VERSION)"
else
    check_fail "Node.js not installed"
fi

if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    check_pass "npm installed ($NPM_VERSION)"
else
    check_fail "npm not installed"
fi
echo ""

# Check dependencies
echo "📦 Checking Dependencies..."
if [ -d node_modules ]; then
    check_pass "Frontend dependencies installed"
else
    check_warn "Frontend dependencies not installed (run: npm install)"
fi

if [ -d backend/node_modules ]; then
    check_pass "Backend dependencies installed"
else
    check_warn "Backend dependencies not installed (run: cd backend && npm install)"
fi
echo ""

# Check build
echo "🔨 Checking Build..."
if [ -d dist ]; then
    check_pass "Frontend build exists"
else
    check_warn "Frontend not built (run: npm run build)"
fi
echo ""

# Check for common issues
echo "🔍 Checking for Common Issues..."

# Check for hardcoded secrets
if grep -r "password.*=.*['\"]" src/ backend/src/ 2>/dev/null | grep -v "password:" | grep -v "// " > /dev/null; then
    check_warn "Possible hardcoded passwords found"
else
    check_pass "No hardcoded passwords detected"
fi

# Check for console.log in production code
if grep -r "console\.log" src/ 2>/dev/null | grep -v "node_modules" | wc -l | grep -v "^0$" > /dev/null; then
    check_warn "console.log statements found (consider removing for production)"
else
    check_pass "No console.log statements in source"
fi

# Check for TODO comments
TODO_COUNT=$(grep -r "TODO\|FIXME" src/ backend/src/ 2>/dev/null | wc -l)
if [ "$TODO_COUNT" -gt 0 ]; then
    check_warn "$TODO_COUNT TODO/FIXME comments found"
else
    check_pass "No TODO/FIXME comments"
fi
echo ""

# Check documentation
echo "📚 Checking Documentation..."
[ -f PRODUCTION_READY_REPORT.md ] && check_pass "Production report exists" || check_warn "Production report missing"
[ -f PRODUCTION_DEPLOYMENT.md ] && check_pass "Deployment guide exists" || check_warn "Deployment guide missing"
[ -f PRODUCTION_CHECKLIST.md ] && check_pass "Checklist exists" || check_warn "Checklist missing"
echo ""

# Summary
echo "===================================="
echo "📊 Verification Summary"
echo "===================================="
echo -e "${GREEN}Passed: $PASS${NC}"
echo -e "${YELLOW}Warnings: $WARN${NC}"
echo -e "${RED}Failed: $FAIL${NC}"
echo ""

if [ $FAIL -eq 0 ]; then
    if [ $WARN -eq 0 ]; then
        echo -e "${GREEN}✅ System is READY for production!${NC}"
        exit 0
    else
        echo -e "${YELLOW}⚠️  System is mostly ready, but has warnings.${NC}"
        echo "Review warnings above before deploying."
        exit 0
    fi
else
    echo -e "${RED}❌ System is NOT ready for production!${NC}"
    echo "Fix the failed checks above before deploying."
    exit 1
fi
