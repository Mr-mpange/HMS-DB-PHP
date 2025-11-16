# 🚀 Deploy Without Docker - Simple Production Setup

## Overview

You can deploy the Hospital Management System without Docker using just Node.js, MySQL, and PM2 (or any process manager).

## Prerequisites

- Node.js 18+ installed
- MySQL 8.0+ installed
- PM2 (optional but recommended)
- Nginx (optional, for reverse proxy)

## Quick Deployment (5 Steps)

### Step 1: Install MySQL

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install mysql-server
sudo mysql_secure_installation
```

**Windows:**
- Download from: https://dev.mysql.com/downloads/mysql/
- Run installer and follow wizard

**Mac:**
```bash
brew install mysql
brew services start mysql
```

### Step 2: Setup Database

```bash
# Login to MySQL
mysql -u root -p

# Create database and user
CREATE DATABASE hospital_db_prod;
CREATE USER 'hospital_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON hospital_db_prod.* TO 'hospital_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Import schema
mysql -u hospital_user -p hospital_db_prod < backend/database/schema.sql
```

### Step 3: Configure Application

```bash
# Navigate to backend
cd backend

# Install dependencies
npm ci --only=production

# Configure environment
cp .env.production .env
nano .env
```

**Update .env:**
```env
PORT=3000
NODE_ENV=production

DB_HOST=localhost
DB_PORT=3306
DB_USER=hospital_user
DB_PASSWORD=your_secure_password
DB_NAME=hospital_db_prod

JWT_SECRET=your_very_secure_random_jwt_secret_key_here
JWT_EXPIRES_IN=24h

FRONTEND_URL=https://your-domain.com

ZENOPAY_API_KEY=your_production_api_key
ZENOPAY_MERCHANT_ID=your_merchant_id
ZENOPAY_ENV=production
```

### Step 4: Setup Database Tables & Users

```bash
# Create tables
node setup-tables.js

# Create admin user
node create-admin.js
```

### Step 5: Start Application

**Option A: Using PM2 (Recommended)**
```bash
# Install PM2 globally
npm install -g pm2

# Start application
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the instructions shown

# View status
pm2 status

# View logs
pm2 logs
```

**Option B: Using Node directly**
```bash
# Start server
NODE_ENV=production node src/server.js

# Or use npm script
npm run start:prod
```

**Option C: Using systemd (Linux)**
```bash
# Create service file
sudo nano /etc/systemd/system/hospital-api.service
```

Add this content:
```ini
[Unit]
Description=Hospital Management System API
After=network.target mysql.service

[Service]
Type=simple
User=your_user
WorkingDirectory=/path/to/hospital-management-system/backend
Environment=NODE_ENV=production
ExecStart=/usr/bin/node src/server.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Then:
```bash
# Reload systemd
sudo systemctl daemon-reload

# Start service
sudo systemctl start hospital-api

# Enable on boot
sudo systemctl enable hospital-api

# Check status
sudo systemctl status hospital-api

# View logs
sudo journalctl -u hospital-api -f
```

## Optional: Setup Nginx Reverse Proxy

### Install Nginx

**Ubuntu/Debian:**
```bash
sudo apt install nginx
```

**Windows:**
- Download from: http://nginx.org/en/download.html

**Mac:**
```bash
brew install nginx
```

### Configure Nginx

Create configuration file:
```bash
sudo nano /etc/nginx/sites-available/hospital-api
```

Add this content:
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL Configuration (after obtaining certificates)
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Frontend (if serving from same server)
    location / {
        root /path/to/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # API Backend
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Socket.io
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Enable site:
```bash
# Create symlink
sudo ln -s /etc/nginx/sites-available/hospital-api /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

## SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

## Database Backups

### Manual Backup

```bash
# Create backup directory
mkdir -p ~/backups

# Backup database
mysqldump -u hospital_user -p hospital_db_prod > ~/backups/hospital_db_$(date +%Y%m%d_%H%M%S).sql

# Compress backup
gzip ~/backups/hospital_db_*.sql
```

### Automated Backups with Cron

```bash
# Create backup script
nano ~/backup-hospital-db.sh
```

Add this content:
```bash
#!/bin/bash
BACKUP_DIR="$HOME/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/hospital_db_$DATE.sql"

mkdir -p $BACKUP_DIR

mysqldump -u hospital_user -pyour_password hospital_db_prod > $BACKUP_FILE
gzip $BACKUP_FILE

# Keep only last 7 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_FILE.gz"
```

Make executable and add to cron:
```bash
chmod +x ~/backup-hospital-db.sh

# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /home/your_user/backup-hospital-db.sh
```

## Monitoring

### Check Application Status

**With PM2:**
```bash
pm2 status
pm2 logs
pm2 monit
```

**With systemd:**
```bash
sudo systemctl status hospital-api
sudo journalctl -u hospital-api -f
```

### Check Database

```bash
mysql -u hospital_user -p -e "SELECT 1"
```

### Check API Health

```bash
curl http://localhost:3000/api/health
```

## Firewall Configuration

**Ubuntu/Debian (UFW):**
```bash
# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

**CentOS/RHEL (firewalld):**
```bash
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

## Updating Application

```bash
# Navigate to project
cd /path/to/hospital-management-system

# Pull latest code
git pull origin main

# Update dependencies
cd backend
npm ci --only=production

# Restart application
pm2 restart hospital-api
# or
sudo systemctl restart hospital-api
```

## Troubleshooting

### Application won't start

```bash
# Check logs
pm2 logs hospital-api
# or
sudo journalctl -u hospital-api -n 50

# Check if port is in use
sudo lsof -i :3000
```

### Database connection error

```bash
# Test MySQL connection
mysql -u hospital_user -p hospital_db_prod

# Check MySQL is running
sudo systemctl status mysql

# Check credentials in .env file
cat backend/.env
```

### Permission errors

```bash
# Fix file permissions
cd backend
chmod -R 755 .
chown -R your_user:your_user .
```

## Performance Optimization

### PM2 Cluster Mode

```bash
# Start with all CPU cores
pm2 start ecosystem.config.js --env production -i max

# Or specify number of instances
pm2 start ecosystem.config.js --env production -i 4
```

### MySQL Optimization

```bash
# Edit MySQL config
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
```

Add/update:
```ini
[mysqld]
max_connections = 200
innodb_buffer_pool_size = 1G
query_cache_size = 64M
```

Restart MySQL:
```bash
sudo systemctl restart mysql
```

## Security Checklist

- [ ] Change default admin password
- [ ] Use strong database password
- [ ] Generate secure JWT_SECRET
- [ ] Configure firewall
- [ ] Enable SSL/HTTPS
- [ ] Setup automated backups
- [ ] Configure log rotation
- [ ] Disable root MySQL access remotely
- [ ] Keep system updated

## Comparison: Docker vs Manual

| Feature | Docker | Manual |
|---------|--------|--------|
| Setup Time | 5 minutes | 15-30 minutes |
| Complexity | Low | Medium |
| Isolation | High | Low |
| Resource Usage | Higher | Lower |
| Portability | High | Medium |
| Updates | Easy | Manual |
| Rollback | Easy | Manual |
| Learning Curve | Medium | Low |

## When to Use Manual Deployment

✅ **Use Manual When:**
- You're familiar with Linux/server administration
- You want more control over the environment
- You have existing infrastructure
- You want to minimize resource usage
- Docker is not available/allowed

❌ **Use Docker When:**
- You want quick deployment
- You need environment consistency
- You want easy scaling
- You're deploying to cloud platforms
- You want easy rollbacks

## Support

For issues:
1. Check logs: `pm2 logs` or `journalctl -u hospital-api`
2. Verify database connection
3. Check firewall rules
4. Review .env configuration

## Summary

**Manual deployment is perfectly fine!** It gives you:
- Full control over the environment
- Lower resource usage
- No Docker dependency
- Traditional server management

Choose the deployment method that works best for your infrastructure and team expertise.
