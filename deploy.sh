#!/bin/bash

# Hospital Management System - Production Deployment Script
# This script automates the deployment process

set -e  # Exit on error

echo "🏥 Hospital Management System - Production Deployment"
echo "======================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    print_error "Please do not run as root"
    exit 1
fi

# Check prerequisites
echo "Checking prerequisites..."

command -v node >/dev/null 2>&1 || { print_error "Node.js is not installed. Install it first."; exit 1; }
command -v npm >/dev/null 2>&1 || { print_error "npm is not installed. Install it first."; exit 1; }
command -v mysql >/dev/null 2>&1 || { print_warning "MySQL client not found. Database operations may fail."; }

print_success "Prerequisites check complete"
echo ""

# Ask for deployment method
echo "Select deployment method:"
echo "1) VPS with PM2 and Nginx"
echo "2) Docker Compose"
echo "3) Build only (manual deployment)"
read -p "Enter choice [1-3]: " deploy_method

case $deploy_method in
    1)
        echo ""
        echo "🚀 Deploying with PM2 and Nginx..."
        
        # Install PM2 if not installed
        if ! command -v pm2 &> /dev/null; then
            echo "Installing PM2..."
            sudo npm install -g pm2
            print_success "PM2 installed"
        fi
        
        # Backend deployment
        echo ""
        echo "📦 Deploying Backend..."
        cd backend
        
        # Check if .env.production exists
        if [ ! -f .env.production ]; then
            print_error ".env.production not found in backend/"
            print_warning "Copy .env.production.example and configure it"
            exit 1
        fi
        
        # Install dependencies
        echo "Installing backend dependencies..."
        npm ci --production
        print_success "Backend dependencies installed"
        
        # Run migrations
        echo "Running database migrations..."
        npm run migrate || print_warning "Migration failed or already run"
        
        # Start with PM2
        echo "Starting backend with PM2..."
        pm2 start ../ecosystem.config.js --env production
        pm2 save
        print_success "Backend started"
        
        cd ..
        
        # Frontend deployment
        echo ""
        echo "🎨 Deploying Frontend..."
        
        # Check if .env.production exists
        if [ ! -f .env.production ]; then
            print_error ".env.production not found"
            print_warning "Copy .env.production.example and configure it"
            exit 1
        fi
        
        # Install dependencies
        echo "Installing frontend dependencies..."
        npm ci
        print_success "Frontend dependencies installed"
        
        # Build
        echo "Building frontend..."
        npm run build
        print_success "Frontend built"
        
        # Copy to nginx directory
        echo "Copying to web directory..."
        sudo mkdir -p /var/www/hospital
        sudo cp -r dist/* /var/www/hospital/
        sudo chown -R www-data:www-data /var/www/hospital
        print_success "Files copied to /var/www/hospital"
        
        # Configure Nginx
        if [ -f /etc/nginx/sites-available/hospital ]; then
            print_warning "Nginx config already exists"
        else
            echo "Configuring Nginx..."
            sudo cp nginx.conf /etc/nginx/sites-available/hospital
            sudo ln -s /etc/nginx/sites-available/hospital /etc/nginx/sites-enabled/
            sudo nginx -t && sudo systemctl reload nginx
            print_success "Nginx configured"
        fi
        
        print_success "Deployment complete!"
        echo ""
        echo "Next steps:"
        echo "1. Configure SSL: sudo certbot --nginx -d your-domain.com"
        echo "2. Check PM2 status: pm2 status"
        echo "3. View logs: pm2 logs hospital-api"
        ;;
        
    2)
        echo ""
        echo "🐳 Deploying with Docker Compose..."
        
        # Check if Docker is installed
        if ! command -v docker &> /dev/null; then
            print_error "Docker is not installed"
            exit 1
        fi
        
        if ! command -v docker-compose &> /dev/null; then
            print_error "Docker Compose is not installed"
            exit 1
        fi
        
        # Check environment files
        if [ ! -f .env.production ] || [ ! -f backend/.env.production ]; then
            print_error "Environment files not found"
            exit 1
        fi
        
        # Build and start containers
        echo "Building Docker images..."
        docker-compose -f docker-compose.prod.yml build
        print_success "Images built"
        
        echo "Starting containers..."
        docker-compose -f docker-compose.prod.yml up -d
        print_success "Containers started"
        
        # Wait for services to be healthy
        echo "Waiting for services to be healthy..."
        sleep 10
        
        # Check health
        docker-compose -f docker-compose.prod.yml ps
        
        print_success "Deployment complete!"
        echo ""
        echo "Next steps:"
        echo "1. Check logs: docker-compose -f docker-compose.prod.yml logs -f"
        echo "2. Check status: docker-compose -f docker-compose.prod.yml ps"
        ;;
        
    3)
        echo ""
        echo "🔨 Building for manual deployment..."
        
        # Backend
        echo "Preparing backend..."
        cd backend
        npm ci --production
        cd ..
        print_success "Backend ready"
        
        # Frontend
        echo "Building frontend..."
        npm ci
        npm run build
        print_success "Frontend built"
        
        echo ""
        print_success "Build complete!"
        echo "Files ready for manual deployment:"
        echo "- Frontend: ./dist/"
        echo "- Backend: ./backend/"
        ;;
        
    *)
        print_error "Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "======================================================"
echo "🎉 Deployment process completed!"
echo "======================================================"
