# 🚀 Quick Start - Production Deployment

## Prerequisites

- Docker & Docker Compose installed
- Domain name configured
- SSL certificate (or use Let's Encrypt)

## 5-Minute Production Deployment

### Step 1: Clone and Configure (2 min)

```bash
# Clone repository
git clone <your-repo-url>
cd hospital-management-system

# Copy and edit environment file
cp .env.production .env
nano .env
```

**Required changes in .env:**
```env
DB_ROOT_PASSWORD=YourSecurePassword123!
DB_PASSWORD=YourAppPassword456!
JWT_SECRET=<generate-with-command-below>
FRONTEND_URL=https://your-domain.com
ZENOPAY_API_KEY=your_production_key
ZENOPAY_MERCHANT_ID=your_merchant_id
ZENOPAY_ENV=production
```

**Generate JWT Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 2: Deploy (2 min)

**Linux/Mac:**
```bash
chmod +x deploy.sh
./deploy.sh
```

**Windows:**
```cmd
deploy.bat
```

### Step 3: Configure SSL (1 min)

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com

# Restart Nginx
docker-compose restart nginx
```

### Step 4: Verify

```bash
# Check services
docker-compose ps

# Test API
curl https://your-domain.com/api/health

# View logs
docker-compose logs -f
```

## Default Login

**Admin:**
- Email: `admin@hospital.com`
- Password: `admin123`

⚠️ **Change password immediately after first login!**

## Quick Commands

```bash
# View logs
docker-compose logs -f backend

# Restart services
docker-compose restart

# Stop services
docker-compose down

# Backup database
./backup-db.sh

# Update application
git pull
docker-compose up -d --build
```

## Troubleshooting

**Services won't start:**
```bash
docker-compose logs backend
docker-compose logs mysql
```

**Database connection error:**
- Check `.env` credentials
- Ensure MySQL is running: `docker-compose ps`

**Port already in use:**
```bash
# Change port in .env
PORT=3001
```

## Next Steps

1. ✅ Change default passwords
2. ✅ Configure automated backups
3. ✅ Set up monitoring
4. ✅ Review security checklist
5. ✅ Train your team

## Support

- 📖 Full guide: [PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md)
- 🔐 Security: [SECURITY.md](SECURITY.md)
- 📋 Complete setup: [PRODUCTION_READY.md](PRODUCTION_READY.md)

---

**You're live in 5 minutes!** 🎉
