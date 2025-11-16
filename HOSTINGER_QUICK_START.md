# 🚀 Hostinger Quick Start Guide

## The Simplest Way to Deploy on Hostinger

### What You'll Do

1. **Frontend** → Upload to Hostinger (your existing hosting)
2. **Backend** → Deploy to Railway.app (free)
3. **Database** → Railway MySQL (free)

**Total Time:** 15 minutes  
**Total Cost:** $3/month (just Hostinger)

---

## Step 1: Deploy Backend to Railway (5 min)

### A. Create Railway Account
1. Go to https://railway.app
2. Sign up with GitHub (free)
3. Verify email

### B. Deploy Backend

**Option 1: Using Railway Dashboard (Easiest)**

1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Connect your GitHub account
4. Select your repository
5. Railway will auto-detect Node.js
6. Click "Deploy"

**Option 2: Using Railway CLI**

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

### C. Add MySQL Database

1. In Railway dashboard, click "New"
2. Select "Database" → "MySQL"
3. Wait for provisioning (1 minute)
4. Railway automatically connects it to your app

### D. Setup Database Tables

```bash
# Using Railway CLI
railway run node setup-tables.js
railway run node create-admin.js

# Or via Railway dashboard
# Go to your service → Settings → Variables
# Add all environment variables from .env.production
```

### E. Get Your Backend URL

1. In Railway dashboard, go to your service
2. Click "Settings" → "Domains"
3. Click "Generate Domain"
4. Copy the URL (e.g., `hospital-backend-production.up.railway.app`)

---

## Step 2: Build Frontend (3 min)

```bash
# 1. Update API URL
echo "VITE_API_URL=https://your-railway-url.up.railway.app/api" > .env.production
echo "VITE_SOCKET_URL=https://your-railway-url.up.railway.app" >> .env.production

# 2. Build
npm run build

# This creates a 'dist' folder
```

---

## Step 3: Upload to Hostinger (5 min)

### Method 1: File Manager (Easiest)

1. Login to Hostinger hPanel
2. Go to "File Manager"
3. Navigate to `public_html` (or your domain folder)
4. Delete existing files (if any)
5. Click "Upload"
6. Select ALL files from your `dist` folder
7. Upload
8. Done! ✅

### Method 2: FTP (FileZilla)

1. Download FileZilla: https://filezilla-project.org
2. Connect:
   - Host: `ftp.your-domain.com`
   - Username: (from Hostinger)
   - Password: (from Hostinger)
   - Port: 21
3. Navigate to `public_html`
4. Drag & drop files from `dist` folder
5. Done! ✅

---

## Step 4: Configure (2 min)

### A. Enable SSL on Hostinger

1. In hPanel, go to "SSL"
2. Select your domain
3. Click "Install SSL" (Free Let's Encrypt)
4. Wait 5 minutes for activation

### B. Add .htaccess for React Router

Create `.htaccess` in `public_html`:

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

## Step 5: Test (1 min)

1. Visit `https://your-domain.com`
2. Try logging in:
   - Email: `admin@hospital.com`
   - Password: `admin123`
3. If it works, you're done! 🎉

---

## Troubleshooting

### "Cannot connect to API"

**Fix:** Check CORS in backend

1. Go to Railway dashboard
2. Open your service
3. Go to "Variables"
4. Add: `FRONTEND_URL=https://your-domain.com`
5. Redeploy

### "404 on page refresh"

**Fix:** Add `.htaccess` (see Step 4B above)

### "SSL not working"

**Fix:** Wait 5-10 minutes after enabling SSL, then clear browser cache

---

## Environment Variables for Railway

Add these in Railway dashboard → Variables:

```env
NODE_ENV=production
PORT=3000

# Database (Railway auto-fills these)
DATABASE_URL=mysql://... (auto-generated)

# Or manually:
DB_HOST=containers-us-west-xxx.railway.app
DB_PORT=3306
DB_USER=root
DB_PASSWORD=xxx (auto-generated)
DB_NAME=railway

# JWT
JWT_SECRET=your_secure_random_string_here
JWT_EXPIRES_IN=24h

# Frontend
FRONTEND_URL=https://your-domain.com

# ZenoPay
ZENOPAY_API_KEY=your_key
ZENOPAY_MERCHANT_ID=your_id
ZENOPAY_ENV=production
```

---

## File Structure on Hostinger

```
public_html/
├── index.html
├── assets/
│   ├── index-xxx.js
│   ├── index-xxx.css
│   └── logo-xxx.png
├── .htaccess
└── favicon.ico
```

---

## Updating Your App

### Update Backend (Railway)

```bash
# Make changes to backend code
git add .
git commit -m "Update backend"
git push

# Railway auto-deploys on push!
```

### Update Frontend (Hostinger)

```bash
# Make changes to frontend code
npm run build

# Upload new dist/* files to Hostinger
# (overwrites old files)
```

---

## Costs

| Service | Cost | What You Get |
|---------|------|--------------|
| **Hostinger** | $3/month | Domain + Hosting + SSL |
| **Railway** | Free | Backend + Database (500 hrs/month) |
| **Total** | **$3/month** | Full application! |

**Note:** Railway free tier includes:
- 500 hours/month (enough for small projects)
- $5 credit/month
- Upgrade to $5/month for unlimited

---

## Alternative: All on Hostinger (If Node.js Supported)

Some Hostinger plans support Node.js:

1. Check if your plan has "Node.js Selector" in cPanel
2. If yes, follow: [DEPLOY_SHARED_HOSTING.md](DEPLOY_SHARED_HOSTING.md#option-2-nodejs-on-shared-hosting-if-supported)
3. If no, use Railway method above (recommended anyway)

---

## Why This Setup is Great

✅ **Cheap** - Only $3/month (Hostinger)  
✅ **Fast** - Static frontend, optimized backend  
✅ **Reliable** - Railway has 99.9% uptime  
✅ **Scalable** - Easy to upgrade when needed  
✅ **Simple** - No server management  
✅ **Secure** - Free SSL on both  

---

## Need Help?

### Railway Issues
- Docs: https://docs.railway.app
- Discord: https://discord.gg/railway

### Hostinger Issues
- Support: https://www.hostinger.com/tutorials
- Live chat in hPanel

### Application Issues
- Check Railway logs: Dashboard → Service → Logs
- Check browser console: F12 → Console

---

## Summary

**3 Simple Steps:**

1. **Deploy backend to Railway** (free, 5 min)
2. **Build frontend** (`npm run build`, 3 min)
3. **Upload to Hostinger** (drag & drop, 5 min)

**That's it!** Your hospital management system is live! 🎉

---

## Quick Commands Reference

```bash
# Build frontend
npm run build

# Deploy to Railway
railway up

# Setup database
railway run node setup-tables.js
railway run node create-admin.js

# View logs
railway logs

# Open Railway dashboard
railway open
```

---

**Ready to deploy?** Start with Step 1! 🚀
