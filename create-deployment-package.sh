#!/bin/bash

# Create Deployment Package for Hostinger
# This creates a ZIP file of only what you need to upload

set -e

echo "=========================================="
echo "Creating Deployment Package"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if dist folder exists
if [ ! -d "dist" ]; then
    echo -e "${RED}Error: dist folder not found${NC}"
    echo "Please build the project first:"
    echo "  ./build-production.sh"
    exit 1
fi

# Create deployment folder
echo -e "${YELLOW}Step 1: Creating deployment folder...${NC}"
rm -rf deployment-package
mkdir -p deployment-package

# Copy dist contents
echo -e "${YELLOW}Step 2: Copying built files...${NC}"
cp -r dist/* deployment-package/

# Copy .htaccess
echo -e "${YELLOW}Step 3: Adding .htaccess...${NC}"
if [ -f "public/.htaccess" ]; then
    cp public/.htaccess deployment-package/
else
    echo "Warning: .htaccess not found"
fi

# Create ZIP file
echo -e "${YELLOW}Step 4: Creating ZIP file...${NC}"
cd deployment-package
zip -r ../hostinger-deployment.zip . > /dev/null
cd ..

# Get file size
SIZE=$(du -h hostinger-deployment.zip | cut -f1)

echo ""
echo -e "${GREEN}=========================================="
echo "Deployment Package Created!"
echo "==========================================${NC}"
echo ""
echo "File: hostinger-deployment.zip"
echo "Size: $SIZE"
echo ""
echo "Next steps:"
echo "1. Login to Hostinger hPanel"
echo "2. Go to File Manager"
echo "3. Navigate to public_html"
echo "4. Upload hostinger-deployment.zip"
echo "5. Extract it (right-click → Extract)"
echo "6. Delete the zip file"
echo ""
echo "Or use FTP to upload the files directly from deployment-package/"
echo ""
