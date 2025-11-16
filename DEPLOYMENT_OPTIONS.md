# 🚀 Deployment Options

## Choose Your Deployment Method

You have **3 flexible deployment options** - choose what works best for you!

---

## Option 1: Docker Deployment (Easiest) ⭐

**Best for:** Quick setup, consistency, easy scaling

### Pros
✅ 5-minute setup
✅ Everything pre-configured
✅ Easy to update and rollback
✅ Consistent across environments
✅ Includes MySQL, Backend, and Nginx

### Cons
❌ Requires Docker installation
❌ Slightly higher resource usage

### Quick Start
```bash
# 1. Configure
cp .env.production .env
nano .env

# 2. Deploy
./deploy.sh  # Linux/Mac
# or
deploy.bat   # Windows

# Done! ✅
```

**📖 Full Guide:** [PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md)

---

## Option 2: Manual Deployment (Traditional) 🔧

**Best for:** Full control, existing infrastructure, no Docker

### Pros
✅ Full control over environment
✅ Lower resource usage
✅ No Docker dependency
✅ Traditional server management
✅ Works with existing MySQL

### Cons
❌ More setup steps
❌ Manual configuration needed
❌ Requires server administration knowledge

### Quick Start
```bash
# 1. Install MySQL
sudo apt install mysql-server

# 2. Setup database
mysql -u root -p < backend/database/schema.sql

# 3. Configure
cd backend
cp .env.production .env
nano .env

# 4. Deploy
./deploy-manual.sh  # Linux/Mac
# or
deploy-manual.bat   # Windows

# Done! ✅
```

**📖 Full Guide:** [DEPLOY_WITHOUT_DOCKER.md](DEPLOY_WITHOUT_DOCKER.md)

---

## Option 3: PM2 Deployment (Production-Grade) 🚀

**Best for:** Production servers, high availability, monitoring

### Pros
✅ Process management
✅ Auto-restart on crashes
✅ Cluster mode (multi-core)
✅ Built-in monitoring
✅ Zero-downtime reloads

### Cons
❌ Requires PM2 installation
❌ More configuration options

### Quick Start
```bash
# 1. Install PM2
npm install -g pm2

# 2. Setup database (same as manual)
cd backend
npm ci --only=production
node setup-tables.js
node create-admin.js

# 3. Start with PM2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup

# Done! ✅
```

**📖 Full Guide:** [DEPLOY_WITHOUT_DOCKER.md](DEPLOY_WITHOUT_DOCKER.md#step-5-start-application)

---

## Comparison Table

| Feature | Docker | Manual | PM2 |
|---------|--------|--------|-----|
| **Setup Time** | 5 min | 15-30 min | 10-15 min |
| **Complexity** | Low | Medium | Medium |
| **Control** | Medium | High | High |
| **Resource Usage** | Higher | Lower | Lower |
| **Scaling** | Easy | Manual | Easy |
| **Monitoring** | Basic | Manual | Built-in |
| **Updates** | Easy | Manual | Easy |
| **Rollback** | Easy | Manual | Medium |
| **Best For** | Quick start | Full control | Production |

---

## Which Should You Choose?

### Choose Docker If:
- ✅ You want the fastest setup
- ✅ You're new to server deployment
- ✅ You want easy updates and rollbacks
- ✅ You're deploying to cloud (AWS, Azure, GCP)
- ✅ You want environment consistency

### Choose Manual If:
- ✅ You have existing MySQL server
- ✅ You want minimal resource usage
- ✅ You're comfortable with server administration
- ✅ Docker is not available/allowed
- ✅ You want maximum control

### Choose PM2 If:
- ✅ You need production-grade process management
- ✅ You want built-in monitoring
- ✅ You need cluster mode (multi-core)
- ✅ You want zero-downtime reloads
- ✅ You're deploying to VPS/dedicated server

---

## Quick Decision Guide

```
Do you have Docker installed?
├─ Yes → Use Docker (Easiest)
└─ No
   ├─ Can you install Docker?
   │  ├─ Yes → Use Docker (Recommended)
   │  └─ No → Continue
   └─ Do you need process management?
      ├─ Yes → Use PM2
      └─ No → Use Manual
```

---

## All Deployment Scripts

### Docker
- `deploy.sh` - Linux/Mac Docker deployment
- `deploy.bat` - Windows Docker deployment

### Manual
- `deploy-manual.sh` - Linux/Mac manual deployment
- `deploy-manual.bat` - Windows manual deployment

### Database
- `backup-db.sh` - Linux/Mac backup script
- `backup-db.bat` - Windows backup script

---

## Prerequisites by Method

### Docker
- Docker Engine 20.10+
- Docker Compose 2.0+
- 2GB RAM minimum
- 20GB disk space

### Manual
- Node.js 18+
- MySQL 8.0+
- 1GB RAM minimum
- 10GB disk space

### PM2
- Node.js 18+
- MySQL 8.0+
- PM2 (npm install -g pm2)
- 1GB RAM minimum
- 10GB disk space

---

## Common to All Methods

### Required Configuration
1. Copy `.env.production` to `.env`
2. Generate secure JWT_SECRET
3. Set database credentials
4. Configure domain/URL
5. Setup ZenoPay credentials

### After Deployment
1. Change default passwords
2. Configure SSL/HTTPS
3. Setup automated backups
4. Configure monitoring
5. Test all functionality

---

## Need Help?

### Documentation
- **Docker:** [PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md)
- **Manual:** [DEPLOY_WITHOUT_DOCKER.md](DEPLOY_WITHOUT_DOCKER.md)
- **Quick Start:** [QUICK_START_PRODUCTION.md](QUICK_START_PRODUCTION.md)
- **Security:** [SECURITY.md](SECURITY.md)
- **Checklist:** [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)

### Quick Commands

**Docker:**
```bash
docker-compose up -d      # Start
docker-compose down       # Stop
docker-compose logs -f    # View logs
```

**PM2:**
```bash
pm2 status               # Status
pm2 logs                 # View logs
pm2 restart hospital-api # Restart
```

**Manual:**
```bash
systemctl status hospital-api  # Status (systemd)
journalctl -u hospital-api -f  # View logs
systemctl restart hospital-api # Restart
```

---

## Summary

**All three methods work perfectly!** Choose based on:
- Your infrastructure
- Your team's expertise
- Your requirements
- Available resources

**No wrong choice** - pick what makes you comfortable! 🎯
