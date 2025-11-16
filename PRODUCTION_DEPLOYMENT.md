# Production Deployment Guide

## Pre-Deployment Checklist

### 1. Environment Configuration ✅
- [x] `.env.production` created for frontend
- [x] `backend/.env.production` created for backend
- [ ] Update all placeholder values with real credentials
- [ ] Set secure JWT_SECRET and SESSION_SECRET
- [ ] Configure database connection strings
- [ ] Set CORS_ORIGIN to your frontend domain
- [ ] Configure VITE_API_URL to your backend domain

### 2. Security Hardening
```bash
# Generate secure secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3. Database Setup
```bash
# Run migrations
cd backend
npm run migrate

# Verify database connection
npm run db:check
```

### 4. Build Applications
```bash
# Build frontend
npm run build

# Test production build locally
npm run preview

# Build backend (if using TypeScript)
cd backend
npm run build
```

### 5. Performance Optimization
- [ ] Enable gzip compression
- [ ] Configure CDN for static assets
- [ ] Set up database indexes
- [ ] Enable Redis caching (optional)
- [ ] Configure load balancer

## Deployment Steps

### Option 1: VPS Deployment (DigitalOcean, AWS EC2, etc.)

#### Step 1: Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx

# Install MySQL
sudo apt install -y mysql-server
```

#### Step 2: Deploy Backend
```bash
# Clone repository
git clone your-repo-url
cd hospital-management/backend

# Install dependencies
npm ci --production

# Copy production env
cp .env.production .env

# Start with PM2
pm2 start src/server.js --name hospital-api
pm2 save
pm2 startup
```

#### Step 3: Deploy Frontend
```bash
# Build frontend
cd ../
npm ci
npm run build

# Copy to nginx
sudo cp -r dist/* /var/www/hospital/
```

#### Step 4: Configure Nginx
```bash
sudo nano /etc/nginx/sites-available/hospital
```

Add configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /var/www/hospital;
        try_files $uri $uri/ /index.html;
        
        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript 
               application/x-javascript application/xml+rss 
               application/json application/javascript;
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/hospital /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### Step 5: SSL Certificate (Let's Encrypt)
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### Option 2: Docker Deployment

#### Create Dockerfile for Frontend
```dockerfile
# frontend/Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### Create Dockerfile for Backend
```dockerfile
# backend/Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
EXPOSE 3000
CMD ["node", "src/server.js"]
```

#### Docker Compose
```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
      MYSQL_DATABASE: ${DB_NAME}
      MYSQL_USER: ${DB_USER}
      MYSQL_PASSWORD: ${DB_PASSWORD}
    volumes:
      - mysql_data:/var/lib/mysql
    restart: always

  backend:
    build: ./backend
    environment:
      - NODE_ENV=production
    env_file:
      - ./backend/.env.production
    depends_on:
      - mysql
    restart: always

  frontend:
    build: .
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - backend
    restart: always

volumes:
  mysql_data:
```

Deploy:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Option 3: Cloud Platform (Heroku, Railway, Render)

#### Heroku Deployment
```bash
# Install Heroku CLI
npm install -g heroku

# Login
heroku login

# Create app
heroku create hospital-management-api

# Add MySQL addon
heroku addons:create jawsdb:kitefin

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-secret

# Deploy
git push heroku main

# Run migrations
heroku run npm run migrate
```

## Post-Deployment

### 1. Monitoring Setup
```bash
# PM2 monitoring
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7

# Setup monitoring dashboard
pm2 link your-pm2-key your-pm2-secret
```

### 2. Database Backup
```bash
# Create backup script
cat > /usr/local/bin/backup-db.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -u user -p password hospital_management > /backups/db_$DATE.sql
find /backups -name "db_*.sql" -mtime +30 -delete
EOF

chmod +x /usr/local/bin/backup-db.sh

# Add to crontab (daily at 2 AM)
crontab -e
0 2 * * * /usr/local/bin/backup-db.sh
```

### 3. Health Checks
```bash
# Backend health check
curl https://your-api.com/health

# Frontend check
curl https://your-domain.com
```

### 4. Performance Testing
```bash
# Install Apache Bench
sudo apt install apache2-utils

# Test API
ab -n 1000 -c 10 https://your-api.com/api/health

# Test frontend
ab -n 1000 -c 10 https://your-domain.com/
```

## Maintenance

### Daily Tasks
- [ ] Check application logs
- [ ] Monitor error rates
- [ ] Review database performance
- [ ] Check disk space

### Weekly Tasks
- [ ] Review security logs
- [ ] Update dependencies
- [ ] Database optimization
- [ ] Backup verification

### Monthly Tasks
- [ ] Security audit
- [ ] Performance review
- [ ] Cost optimization
- [ ] Update documentation

## Rollback Plan

### Quick Rollback
```bash
# PM2 rollback
pm2 reload hospital-api --update-env

# Git rollback
git revert HEAD
git push origin main

# Database rollback
mysql -u user -p hospital_management < /backups/db_latest.sql
```

## Troubleshooting

### Application Won't Start
```bash
# Check logs
pm2 logs hospital-api

# Check port
sudo netstat -tulpn | grep :3000

# Restart services
pm2 restart hospital-api
sudo systemctl restart nginx
```

### Database Connection Issues
```bash
# Test connection
mysql -h host -u user -p

# Check MySQL status
sudo systemctl status mysql

# Review logs
sudo tail -f /var/log/mysql/error.log
```

### High Memory Usage
```bash
# Check memory
free -h
pm2 monit

# Restart if needed
pm2 restart hospital-api
```

## Security Checklist

- [ ] All secrets in environment variables
- [ ] HTTPS enabled with valid certificate
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] SQL injection protection
- [ ] XSS protection headers
- [ ] CSRF protection
- [ ] Input validation
- [ ] File upload restrictions
- [ ] Database user has minimal permissions
- [ ] Regular security updates
- [ ] Firewall configured
- [ ] SSH key authentication only
- [ ] Fail2ban installed

## Performance Optimization

### Database Indexes
```sql
-- Add indexes for frequently queried columns
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_patients_phone ON patients(phone);
CREATE INDEX idx_visits_status ON patient_visits(overall_status);
CREATE INDEX idx_prescriptions_status ON prescriptions(status);
```

### Nginx Caching
```nginx
# Add to nginx config
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=1g inactive=60m;

location /api {
    proxy_cache api_cache;
    proxy_cache_valid 200 5m;
    proxy_cache_use_stale error timeout http_500 http_502 http_503 http_504;
}
```

### Redis Caching (Optional)
```bash
# Install Redis
sudo apt install redis-server

# Configure in backend
npm install redis
```

## Monitoring & Alerts

### Setup Uptime Monitoring
- UptimeRobot (free)
- Pingdom
- StatusCake

### Error Tracking
- Sentry.io
- Rollbar
- Bugsnag

### Performance Monitoring
- New Relic
- DataDog
- AppDynamics

## Cost Optimization

### Estimated Monthly Costs

**Small Scale (100-500 users):**
- VPS: $10-20/month
- Database: $10/month
- Domain: $12/year
- SSL: Free (Let's Encrypt)
- **Total: ~$25/month**

**Medium Scale (500-2000 users):**
- VPS: $40-80/month
- Database: $25/month
- CDN: $10/month
- Monitoring: $10/month
- **Total: ~$85/month**

**Large Scale (2000+ users):**
- Load Balancer: $10/month
- Multiple VPS: $150/month
- Database Cluster: $100/month
- CDN: $30/month
- Monitoring: $30/month
- **Total: ~$320/month**

## Support & Documentation

### Created Files
- ✅ `.env.production` - Frontend environment
- ✅ `backend/.env.production` - Backend environment
- ✅ `PRODUCTION_DEPLOYMENT.md` - This guide

### Next Steps
1. Update environment variables with real values
2. Choose deployment method
3. Follow deployment steps
4. Configure monitoring
5. Test thoroughly
6. Go live!

---

**Status:** 🚀 Ready for Production Deployment
