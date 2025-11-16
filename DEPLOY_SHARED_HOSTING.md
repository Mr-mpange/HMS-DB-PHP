# 🌐 Deploy to Shared Hosting (Hostinger, cPanel, etc.)

## Overview

Deploy your Hospital Management System to shared hosting providers like Hostinger, Bluehost, SiteGround, or any cPanel-based hosting.

## ⚠️ Important Limitations

**Shared hosting has limitations:**
- ❌ No Docker support
- ❌ No PM2 or process managers
- ❌ Limited Node.js support (some hosts don't support it)
- ❌ No root/sudo access
- ❌ Limited resources

**Recommended Solution:** Use **VPS hosting** instead (much better for Node.js apps)

However, if you must use shared hosting, here's how:

---

## Option 1: Frontend Only on Shared Hosting (Recommended)

**Best approach:** Host frontend on shared hosting, backend on VPS/cloud

### Architecture
```
Shared Hosting (Hostinger)     VPS/Cloud Server
├── Frontend (React/Vue)  →    ├── Backend API (Node.js)
├── Static files               └── MySQL Database
└── index.html
```

### Steps

#### 1. Build Frontend for Production

```bash
# In your project root
npm run build

# This creates a 'dist' folder with static files
```

#### 2. Upload to Shared Hosting

**Via cPanel File Manager:**
1. Login to cPanel
2. Go to File Manager
3. Navigate to `public_html` (or your domain folder)
4. Upload all files from `dist` folder
5. Done!

**Via FTP:**
```bash
# Using FileZilla or any FTP client
Host: ftp.your-domain.com
Username: your-cpanel-username
Password: your-cpanel-password
Port: 21

# Upload dist/* to public_html/
```

#### 3. Configure Frontend API URL

Update your frontend `.env`:
```env
VITE_API_URL=https://your-backend-vps.com/api
VITE_SOCKET_URL=https://your-backend-vps.com
```

Rebuild:
```bash
npm run build
```

#### 4. Deploy Backend to VPS

Use a cheap VPS for backend:
- **DigitalOcean** - $6/month
- **Vultr** - $6/month
- **Linode** - $5/month
- **Hetzner** - €4/month

Follow the manual deployment guide: [DEPLOY_WITHOUT_DOCKER.md](DEPLOY_WITHOUT_DOCKER.md)

---

## Option 2: Node.js on Shared Hosting (If Supported)

Some shared hosts support Node.js (check with your provider).

### Check if Your Host Supports Node.js

**Hostinger:** ✅ Yes (on some plans)
**Bluehost:** ⚠️ Limited
**SiteGround:** ⚠️ Limited
**A2 Hosting:** ✅ Yes

### Steps for Hostinger with Node.js

#### 1. Enable Node.js in cPanel

1. Login to Hostinger cPanel
2. Find "Setup Node.js App" or "Node.js Selector"
3. Create new application:
   - Node.js version: 18.x
   - Application mode: Production
   - Application root: `hospital-backend`
   - Application URL: `api.your-domain.com`
   - Application startup file: `src/server.js`

#### 2. Upload Backend Files

**Via FTP or File Manager:**
```
/home/username/hospital-backend/
├── src/
├── database/
├── package.json
├── .env
└── ... (all backend files)
```

#### 3. Setup Database

**In cPanel:**
1. Go to "MySQL Databases"
2. Create new database: `username_hospital`
3. Create new user: `username_hospital_user`
4. Add user to database with ALL PRIVILEGES
5. Note the credentials

#### 4. Import Database Schema

**Via phpMyAdmin:**
1. Open phpMyAdmin in cPanel
2. Select your database
3. Click "Import"
4. Upload `backend/database/schema.sql`
5. Click "Go"

#### 5. Configure Environment

Create `.env` file in backend root:
```env
PORT=3000
NODE_ENV=production

# Database (use cPanel credentials)
DB_HOST=localhost
DB_PORT=3306
DB_USER=username_hospital_user
DB_PASSWORD=your_database_password
DB_NAME=username_hospital

# JWT Secret
JWT_SECRET=your_very_secure_random_jwt_secret_key_here
JWT_EXPIRES_IN=24h

# Frontend URL
FRONTEND_URL=https://your-domain.com

# ZenoPay
ZENOPAY_API_KEY=your_production_api_key
ZENOPAY_MERCHANT_ID=your_merchant_id
ZENOPAY_ENV=production
```

#### 6. Install Dependencies

**Via SSH (if available):**
```bash
cd ~/hospital-backend
npm ci --only=production
```

**Via cPanel Terminal:**
1. Open "Terminal" in cPanel
2. Run:
```bash
cd hospital-backend
npm ci --only=production
node setup-tables.js
node create-admin.js
```

#### 7. Start Application

In cPanel Node.js App Manager:
1. Click "Start" or "Restart"
2. Check status - should show "Running"

#### 8. Setup Domain/Subdomain

**Option A: Subdomain for API**
1. Create subdomain: `api.your-domain.com`
2. Point to Node.js app
3. Enable SSL (Let's Encrypt in cPanel)

**Option B: Proxy through .htaccess**

Create `.htaccess` in `public_html`:
```apache
# Proxy API requests to Node.js
RewriteEngine On
RewriteCond %{REQUEST_URI} ^/api/
RewriteRule ^api/(.*)$ http://localhost:3000/api/$1 [P,L]

# Serve frontend
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.html [L]
```

---

## Option 3: Backend on Free/Cheap Services

Host backend on free/cheap platforms, frontend on shared hosting.

### Backend Options

#### A. Railway.app (Recommended)
- ✅ Free tier available
- ✅ Easy deployment
- ✅ MySQL included
- ✅ Automatic HTTPS

**Deploy:**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy
cd backend
railway init
railway up
```

#### B. Render.com
- ✅ Free tier
- ✅ Easy deployment
- ✅ PostgreSQL/MySQL
- ✅ Automatic HTTPS

**Deploy:**
1. Push code to GitHub
2. Connect Render to GitHub
3. Create new Web Service
4. Select repository
5. Configure:
   - Build: `npm install`
   - Start: `node src/server.js`
6. Add environment variables
7. Deploy!

#### C. Fly.io
- ✅ Free tier
- ✅ Global deployment
- ✅ Easy scaling

**Deploy:**
```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Deploy
cd backend
fly launch
fly deploy
```

#### D. Heroku (Paid)
- ✅ Easy deployment
- ✅ Add-ons available
- ⚠️ No free tier anymore

---

## Recommended Setup for Hostinger

### Best Configuration

```
┌─────────────────────────────────────┐
│   Hostinger Shared Hosting          │
│   - Frontend (Static files)         │
│   - Domain: your-domain.com         │
│   - SSL: Let's Encrypt (Free)       │
└─────────────────────────────────────┘
              ↓ API Calls
┌─────────────────────────────────────┐
│   Railway.app / Render.com (Free)   │
│   - Backend API (Node.js)           │
│   - MySQL Database                  │
│   - Domain: api.your-domain.com     │
└─────────────────────────────────────┘
```

### Why This Works Best

✅ **Frontend on Hostinger:**
- Fast static file serving
- Free SSL
- Use your existing hosting
- No Node.js issues

✅ **Backend on Railway/Render:**
- Proper Node.js support
- Free tier available
- Automatic scaling
- Built-in database
- Easy updates

---

## Step-by-Step: Hostinger + Railway

### Part 1: Deploy Backend to Railway

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Deploy backend
cd backend
railway init
railway up

# 4. Add MySQL database
railway add mysql

# 5. Setup database
railway run node setup-tables.js
railway run node create-admin.js

# 6. Get your API URL
railway domain
# Example: https://hospital-backend-production.up.railway.app
```

### Part 2: Build Frontend

```bash
# 1. Update API URL
echo "VITE_API_URL=https://your-railway-url.up.railway.app/api" > .env.production
echo "VITE_SOCKET_URL=https://your-railway-url.up.railway.app" >> .env.production

# 2. Build
npm run build
```

### Part 3: Upload to Hostinger

**Via cPanel File Manager:**
1. Login to Hostinger cPanel
2. Go to File Manager
3. Navigate to `public_html`
4. Delete default files
5. Upload all files from `dist` folder
6. Done!

**Via FTP:**
```bash
# Use FileZilla
Host: ftp.your-domain.com
Username: your-username
Password: your-password

# Upload dist/* to public_html/
```

### Part 4: Configure Domain

**In Hostinger:**
1. Go to Domains
2. Select your domain
3. Enable SSL (Let's Encrypt)
4. Wait for SSL to activate

**Test:**
```bash
# Visit your site
https://your-domain.com

# Should load frontend and connect to Railway backend
```

---

## Troubleshooting

### Frontend loads but API fails

**Check CORS:**
In `backend/src/server.js`, ensure:
```javascript
const cors = require('cors');
app.use(cors({
  origin: 'https://your-domain.com',
  credentials: true
}));
```

### Database connection fails

**Check Railway environment variables:**
```bash
railway variables
```

Ensure they match your `.env` file.

### 404 errors on refresh

**Add `.htaccess` to public_html:**
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

---

## Cost Comparison

| Option | Frontend | Backend | Database | Total/Month |
|--------|----------|---------|----------|-------------|
| **Hostinger + Railway** | $3 | Free | Free | **$3** |
| **Hostinger + Render** | $3 | Free | Free | **$3** |
| **Hostinger + VPS** | $3 | $6 | Included | **$9** |
| **All on VPS** | Included | Included | Included | **$6** |

---

## Recommendations

### For Small Projects
✅ **Hostinger + Railway.app**
- Cheapest option
- Easy to setup
- Free backend hosting

### For Growing Projects
✅ **VPS (DigitalOcean/Vultr)**
- Full control
- Better performance
- More reliable
- Only $6/month

### For Enterprise
✅ **Cloud Platform (AWS/Azure/GCP)**
- Scalable
- Professional
- High availability

---

## Quick Start Script

```bash
#!/bin/bash

echo "Deploying to Hostinger + Railway"

# 1. Deploy backend to Railway
cd backend
railway init
railway up
railway add mysql
railway run node setup-tables.js
railway run node create-admin.js
BACKEND_URL=$(railway domain)

# 2. Build frontend
cd ..
echo "VITE_API_URL=https://$BACKEND_URL/api" > .env.production
npm run build

# 3. Upload to Hostinger
echo "Upload the 'dist' folder to Hostinger via FTP or File Manager"
echo "Backend URL: https://$BACKEND_URL"
```

---

## Summary

**For Hostinger (Shared Hosting):**

1. ✅ **Host frontend** on Hostinger (static files)
2. ✅ **Host backend** on Railway/Render (free tier)
3. ✅ **Connect them** via API URL
4. ✅ **Total cost:** $3-9/month

**This is the best approach for shared hosting!** 🚀

Need help? Check:
- Railway docs: https://docs.railway.app
- Render docs: https://render.com/docs
- Hostinger support: https://www.hostinger.com/tutorials
