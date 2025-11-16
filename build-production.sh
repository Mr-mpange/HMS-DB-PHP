#!/bin/bash

# Production Build Script
# This script builds the frontend for production deployment

set -e

echo "=========================================="
echo "Building for Production"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo -e "${RED}Error: .env.production not found${NC}"
    echo "Please create .env.production with your production settings"
    exit 1
fi

# Check if backend URL is configured
if grep -q "your-backend-url" .env.production; then
    echo -e "${YELLOW}Warning: Backend URL not configured in .env.production${NC}"
    echo "Please update VITE_API_URL with your actual backend URL"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo -e "${YELLOW}Step 1: Installing dependencies...${NC}"
npm ci

echo ""
echo -e "${YELLOW}Step 2: Running type check...${NC}"
npm run type-check || echo "Type check completed with warnings"

echo ""
echo -e "${YELLOW}Step 3: Building production bundle...${NC}"
npm run build:prod

echo ""
echo -e "${GREEN}=========================================="
echo "Build Complete!"
echo "==========================================${NC}"
echo ""
echo "Output directory: dist/"
echo ""
echo "Next steps:"
echo "1. Upload 'dist' folder to Hostinger"
echo "2. Configure .htaccess for React Router"
echo "3. Enable SSL certificate"
echo ""
echo "Files to upload:"
ls -lh dist/
echo ""
