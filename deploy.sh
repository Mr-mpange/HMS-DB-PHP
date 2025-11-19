#!/bin/bash

echo "🚀 Preparing Hospital Management System for Production"
echo "======================================================"

# Clean up test files
echo "📦 Cleaning up..."
find . -name "*.test.*" -type f -delete 2>/dev/null
find . -name "test-*.js" -type f -delete 2>/dev/null
find . -name "check-*.js" -type f -delete 2>/dev/null
find . -name "*.backup.*" -type f -delete 2>/dev/null

# Install and build frontend
echo "🏗️  Building frontend..."
npm install
npm run build

# Install backend dependencies
echo "📦 Installing backend..."
cd backend
npm install --production
cd ..

# Create deployment package
echo "📦 Creating deployment package..."
mkdir -p deployment/frontend deployment/backend

cp -r dist/* deployment/frontend/
cp -r backend/src deployment/backend/
cp backend/package*.json deployment/backend/
cp backend/.env.example deployment/backend/
cp README.md deployment/

# Create archive
cd deployment
tar -czf ../hospital-system.tar.gz .
cd ..

echo "✅ Done! Package: hospital-system.tar.gz"
echo ""
echo "Next: Upload to Hostinger and follow README.md"
