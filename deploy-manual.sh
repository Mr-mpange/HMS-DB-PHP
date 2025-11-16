#!/bin/bash

# Manual Deployment Script (Without Docker)
# Hospital Management System

set -e

echo "=========================================="
echo "Hospital Management System"
echo "Manual Deployment (No Docker)"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if .env exists
if [ ! -f backend/.env ]; then
    echo -e "${RED}Error: backend/.env file not found${NC}"
    echo "Please copy backend/.env.production to backend/.env and configure it"
    exit 1
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed${NC}"
    echo "Please install Node.js 18+ from https://nodejs.org"
    exit 1
fi

echo -e "${GREEN}✓ Node.js found: $(node --version)${NC}"

# Check MySQL
if ! command -v mysql &> /dev/null; then
    echo -e "${RED}Error: MySQL is not installed${NC}"
    echo "Please install MySQL 8.0+"
    exit 1
fi

echo -e "${GREEN}✓ MySQL found${NC}"

# Navigate to backend
cd backend

echo ""
echo -e "${YELLOW}Step 1: Installing dependencies...${NC}"
npm ci --only=production

echo ""
echo -e "${YELLOW}Step 2: Setting up database tables...${NC}"
node setup-tables.js

echo ""
echo -e "${YELLOW}Step 3: Creating admin user...${NC}"
node create-admin.js

echo ""
echo -e "${YELLOW}Step 4: Starting application...${NC}"

# Check if PM2 is installed
if command -v pm2 &> /dev/null; then
    echo "Using PM2 process manager..."
    pm2 start ecosystem.config.js --env production
    pm2 save
    echo ""
    echo -e "${GREEN}✓ Application started with PM2${NC}"
    echo ""
    echo "Useful PM2 commands:"
    echo "  - View status: pm2 status"
    echo "  - View logs: pm2 logs"
    echo "  - Restart: pm2 restart hospital-api"
    echo "  - Stop: pm2 stop hospital-api"
else
    echo -e "${YELLOW}PM2 not found. Install it for better process management:${NC}"
    echo "  npm install -g pm2"
    echo ""
    echo "Starting with Node.js directly..."
    echo "Note: This will run in foreground. Press Ctrl+C to stop."
    echo ""
    NODE_ENV=production node src/server.js
fi

echo ""
echo -e "${GREEN}=========================================="
echo "Deployment Complete!"
echo "==========================================${NC}"
echo ""
echo "Services:"
echo "  - Backend API: http://localhost:3000"
echo "  - Health Check: http://localhost:3000/api/health"
echo ""
echo "Default credentials:"
echo "  - Admin: admin@hospital.com / admin123"
echo "  - Doctor: doctor@hospital.com / doctor123"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: Change default passwords after first login!${NC}"
echo ""
