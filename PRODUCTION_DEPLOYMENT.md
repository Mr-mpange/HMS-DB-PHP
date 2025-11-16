# Production Deployment Guide

## Overview

This guide covers deploying the Hospital Management System to production using Docker and Docker Compose.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- Domain name (for SSL/HTTPS)
- MySQL 8.0+ (if not using Docker)
- Node.js 18+ (if not using Docker)

## Quick Start (Docker)

### 1. Configure Environment

```bash
# Copy production environment template
cp .env.production .env

# Edit .env with your production values
nano .env
```

**Required Configuration:**
- `DB_ROOT_PASSWORD` - MySQL root password
- `DB_PASSWORD` - Application database password
- `JWT_SECRET` - Secure random string (min 32 characters)
- `FRONTEND_URL` - Your production domain
- `ZENOPAY_API_KEY` - Production ZenoPay API key
- `ZENOPAY_MERCHANT_ID` - Production merchant ID

### 2. Deploy with Docker

**Linux/Mac:**
```bash
chmod +x deploy.sh
./deploy.sh
```

**Windows:**
```cmd
deploy.bat
```

### 3. Verify Deployment

```bash
# Check services status
docker-compose ps

# View logs
docker-compose logs -f

# Test API
curl http://localhost:3000/api/health
```

## Manual Deployment (Without Docker)

### 1. Install Dependencies

```bash
cd backend
npm ci --only=production
```

### 2. Configure Environment

```bash
cp .env.production .env
# Edit .env with production values
```

### 3. Setup Database

```bash
# Create database and tables
node setup-tables.js

# Create admin user
node create-admin.js
```

### 4. Start with PM2

```bash
# Install PM2 globally
npm install -g pm2

# Start application
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

## SSL/HTTPS Configuration

### Using Let's Encrypt (Recommended)

1. **Install Certbot:**
```bash
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx
```

2. **Obtain Certificate:**
```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

3. **Auto-renewal:**
```bash
sudo certbot renew --dry-run
```

### Manual SSL Certificate

1. Place your SSL certificates in `nginx/ssl/`:
   - `fullchain.pem` - Full certificate chain
   - `privkey.pem` - Private key

2. Update `nginx/nginx.conf` with your domain name

3. Restart Nginx:
```bash
docker-compose restart nginx
```

## Environment Variables

### Backend (.env)

```env
# Server
PORT=3000
NODE_ENV=production

# Database
DB_HOST=mysql
DB_PORT=3306
DB_USER=hospital_user
DB_PASSWORD=your_secure_password
DB_NAME=hospital_db_prod

# JWT
JWT_SECRET=your_very_secure_random_jwt_secret_key
JWT_EXPIRES_IN=24h

# CORS
FRONTEND_URL=https://your-domain.com

# ZenoPay
ZENOPAY_API_KEY=your_production_api_key
ZENOPAY_MERCHANT_ID=your_merchant_id
ZENOPAY_ENV=production

# Security
HELMET_ENABLED=true
TRUST_PROXY=true

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads
```

## Database Backup

### Automated Backup Script

```bash
#!/bin/bash
# backup-db.sh

BACKUP_DIR="/backups/mysql"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/hospital_db_$DATE.sql"

mkdir -p $BACKUP_DIR

docker-compose exec -T mysql mysqldump \
  -u root \
  -p$DB_ROOT_PASSWORD \
  hospital_db_prod > $BACKUP_FILE

gzip $BACKUP_FILE

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_FILE.gz"
```

### Setup Cron Job

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /path/to/backup-db.sh
```

## Monitoring

### Health Checks

```bash
# API Health
curl http://localhost:3000/api/health

# Database Health
docker-compose exec mysql mysqladmin ping -h localhost

# Container Status
docker-compose ps
```

### Logs

```bash
# View all logs
docker-compose logs -f

# View specific service
docker-compose logs -f backend

# View last 100 lines
docker-compose logs --tail=100 backend
```

### PM2 Monitoring (Non-Docker)

```bash
# View status
pm2 status

# View logs
pm2 logs

# Monitor resources
pm2 monit

# Web dashboard
pm2 web
```

## Scaling

### Horizontal Scaling with PM2

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'hospital-api',
    script: './src/server.js',
    instances: 4, // or 'max' for all CPU cores
    exec_mode: 'cluster',
    // ... other config
  }]
};
```

### Load Balancing with Nginx

```nginx
upstream backend {
    least_conn;
    server backend1:3000;
    server backend2:3000;
    server backend3:3000;
}
```

## Security Checklist

- [ ] Change all default passwords
- [ ] Use strong JWT secret (min 32 characters)
- [ ] Enable HTTPS/SSL
- [ ] Configure firewall rules
- [ ] Enable rate limiting
- [ ] Set up database backups
- [ ] Configure log rotation
- [ ] Enable security headers (Helmet)
- [ ] Use environment variables for secrets
- [ ] Restrict database access
- [ ] Enable CORS only for your domain
- [ ] Set up monitoring and alerts
- [ ] Regular security updates

## Performance Optimization

### Database Optimization

```sql
-- Add indexes for frequently queried columns
CREATE INDEX idx_patient_name ON patients(full_name);
CREATE INDEX idx_appointment_date ON appointments(appointment_date);
CREATE INDEX idx_visit_status ON patient_visits(overall_status);

-- Optimize tables
OPTIMIZE TABLE patients;
OPTIMIZE TABLE appointments;
OPTIMIZE TABLE prescriptions;
```

### Nginx Caching

```nginx
# Add to nginx.conf
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=1g inactive=60m;

location /api/ {
    proxy_cache api_cache;
    proxy_cache_valid 200 5m;
    proxy_cache_key "$scheme$request_method$host$request_uri";
    add_header X-Cache-Status $upstream_cache_status;
    # ... other proxy settings
}
```

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker-compose logs backend

# Check container status
docker-compose ps

# Restart specific service
docker-compose restart backend
```

### Database Connection Issues

```bash
# Check MySQL is running
docker-compose exec mysql mysqladmin ping

# Check connection from backend
docker-compose exec backend node -e "require('./src/config/database').execute('SELECT 1').then(() => console.log('Connected')).catch(console.error)"
```

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000  # Linux/Mac
netstat -ano | findstr :3000  # Windows

# Kill process or change port in .env
```

## Maintenance

### Update Application

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose build
docker-compose up -d

# Or without downtime
docker-compose up -d --no-deps --build backend
```

### Database Migration

```bash
# Backup first!
./backup-db.sh

# Run migration
docker-compose exec backend node migrations/001_add_new_column.js
```

## Support

For issues or questions:
- Check logs: `docker-compose logs -f`
- Review documentation
- Contact system administrator

## Production Checklist

Before going live:

- [ ] All environment variables configured
- [ ] SSL certificates installed
- [ ] Database backups configured
- [ ] Monitoring set up
- [ ] Security headers enabled
- [ ] Rate limiting configured
- [ ] Admin user created
- [ ] Test all API endpoints
- [ ] Load testing completed
- [ ] Disaster recovery plan documented
- [ ] Team trained on deployment process

## Useful Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart services
docker-compose restart

# View logs
docker-compose logs -f

# Execute command in container
docker-compose exec backend node create-admin.js

# Scale service
docker-compose up -d --scale backend=3

# Update single service
docker-compose up -d --no-deps --build backend

# Clean up
docker-compose down -v  # Remove volumes
docker system prune -a  # Clean all unused resources
```
