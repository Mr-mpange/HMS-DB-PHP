#!/bin/bash

# Hospital Management System - Production Deployment Script

set -e

echo "=========================================="
echo "Hospital Management System Deployment"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}Error: .env file not found${NC}"
    echo "Please copy .env.production to .env and configure it"
    exit 1
fi

# Load environment variables
source .env

echo -e "${YELLOW}Step 1: Building Docker images...${NC}"
docker-compose build

echo ""
echo -e "${YELLOW}Step 2: Starting services...${NC}"
docker-compose up -d

echo ""
echo -e "${YELLOW}Step 3: Waiting for MySQL to be ready...${NC}"
sleep 10

echo ""
echo -e "${YELLOW}Step 4: Setting up database tables...${NC}"
docker-compose exec backend node setup-tables.js

echo ""
echo -e "${YELLOW}Step 5: Creating admin user...${NC}"
docker-compose exec backend node create-admin.js

echo ""
echo -e "${GREEN}=========================================="
echo "Deployment Complete!"
echo "==========================================${NC}"
echo ""
echo "Services:"
echo "  - Backend API: http://localhost:3000"
echo "  - MySQL: localhost:3306"
echo "  - Nginx: http://localhost:80"
echo ""
echo "Default credentials:"
echo "  - Admin: admin@hospital.com / admin123"
echo "  - Doctor: doctor@hospital.com / doctor123"
echo ""
echo "Useful commands:"
echo "  - View logs: docker-compose logs -f"
echo "  - Stop services: docker-compose down"
echo "  - Restart: docker-compose restart"
echo ""
