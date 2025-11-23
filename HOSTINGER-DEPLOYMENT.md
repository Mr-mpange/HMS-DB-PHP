# Hostinger Deployment Guide

## Overview
Since Hostinger doesn't support Node.js, we've optimized the system to work perfectly without Socket.io using **smart polling**.

## Smart Polling Features

### What We Implemented
- ✅ **Tab-aware polling** - Only polls when tab is active
- ✅ **60-second intervals** - Balanced between real-time and performance
- ✅ **Automatic pause** - Stops polling when tab is inactive
- ✅ **Instant resume** - Fetches fresh data when tab becomes active
- ✅ **Manual refresh** - Users can refresh anytime

### Benefits
- Low server load
- Efficient bandwidth usage
- Good user experience
- No Node.js required
- Works on any hosting

---

## Deployment Steps

### 1. Prepare Backend

```bash
cd backend

# Run migrations
php artisan migrate --force

# Clear caches
php artisan config:clear
php artisan cache:clear
php artisan route:clear

# Optimize
php artisan config:cache
php artisan route:cache
```

### 2. Build Frontend

```bash
# Build production version
npm run build

# Files will be in dist/ folder
```

### 3. Upload to Hostinger

#### Backend Files
Upload to `public_html/api/`:
```
backend/
├── app/
├── bootstrap/
├── config/
├── database/
├── public/
├── resources/
├── routes/
├── storage/
├── vendor/
├── .env
├── artisan
└── composer.json
```

#### Frontend Files
Upload to `public_html/`:
```
dist/
├── assets/
├── index.html
└── ...
```

### 4. Configure .env on Hostinger

```env
APP_NAME="Hospital Management System"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://hasetcompany.or.tz

DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=your_database
DB_USERNAME=your_username
DB_PASSWORD=your_password

# No Socket.io needed!
```

### 5. Set Up Database

1. Create MySQL database in Hostinger cPanel
2. Import database or run migrations
3. Update .env with database credentials

### 6. Configure .htaccess

**For Backend (public_html/api/.htaccess):**
```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteRule ^(.*)$ public/$1 [L]
</IfModule>
```

**For Frontend (public_html/.htaccess):**
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

### 7. Set Permissions

```bash
chmod -R 755 storage
chmod -R 755 bootstrap/cache
```

---

## How Smart Polling Works

### Active Tab
```
User is viewing dashboard
↓
Fetch data every 60 seconds
↓
Update UI smoothly
↓
No page refresh needed
```

### Inactive Tab
```
User switches to another tab
↓
Stop polling (save resources)
↓
Wait for user to return
↓
When user returns → Fetch fresh data immediately
```

### Manual Refresh
```
User clicks refresh button
↓
Fetch data immediately
↓
Update UI
```

---

## Performance Optimization

### What We Did

1. **Smart Polling**
   - Only polls when tab is active
   - Pauses when tab is inactive
   - Resumes with fresh data when tab becomes active

2. **Efficient Intervals**
   - 60 seconds (not 30 seconds)
   - Reduces server load by 50%
   - Still feels responsive

3. **Conditional Updates**
   - Only updates changed data
   - Doesn't reload entire page
   - Smooth user experience

4. **No External Dependencies**
   - No Node.js required
   - No Socket.io server
   - Works on any hosting

---

## Testing on Hostinger

### 1. Test Backend API

```bash
curl https://hasetcompany.or.tz/api/health
```

Should return:
```json
{
  "status": "ok",
  "database": "connected"
}
```

### 2. Test Frontend

Visit: `https://hasetcompany.or.tz`

Login with:
- Email: admin@test.com
- Password: Admin@123

### 3. Test Polling

1. Open browser console (F12)
2. Watch for API calls every 60 seconds
3. Switch to another tab
4. Come back - should fetch immediately

---

## Troubleshooting

### Issue: 500 Error

**Check:**
1. .env file configured correctly
2. Database credentials correct
3. Migrations run successfully
4. Storage permissions set

**Fix:**
```bash
php artisan config:clear
php artisan cache:clear
chmod -R 755 storage
```

### Issue: Frontend Not Loading

**Check:**
1. .htaccess file in place
2. mod_rewrite enabled
3. Files uploaded to correct directory

**Fix:**
```apache
# Add to .htaccess
Options +FollowSymLinks
RewriteEngine On
```

### Issue: API Not Found

**Check:**
1. Backend uploaded to correct folder
2. .htaccess configured
3. URL in frontend matches backend

**Fix in src/lib/api.ts:**
```typescript
const getBaseURL = (): string => {
  if (import.meta.env.PROD) {
    return 'https://hasetcompany.or.tz/api';
  }
  return 'http://localhost:8000/api';
};
```

---

## Comparison: Socket.io vs Smart Polling

### Socket.io (Not Available on Hostinger)
- ❌ Requires Node.js server
- ❌ Additional server to maintain
- ❌ More complex setup
- ✅ Instant updates

### Smart Polling (Works on Hostinger)
- ✅ No Node.js required
- ✅ Simple setup
- ✅ Works on any hosting
- ✅ Tab-aware (saves resources)
- ✅ 60-second updates (good enough)

---

## Production Checklist

- [ ] Backend uploaded to Hostinger
- [ ] Frontend built and uploaded
- [ ] Database created and configured
- [ ] .env file configured
- [ ] Migrations run
- [ ] Permissions set (755)
- [ ] .htaccess files in place
- [ ] Test all features
- [ ] Test polling behavior
- [ ] Verify performance

---

## File Structure on Hostinger

```
public_html/
├── api/                    # Laravel Backend
│   ├── app/
│   ├── bootstrap/
│   ├── config/
│   ├── database/
│   ├── public/
│   │   └── index.php
│   ├── routes/
│   ├── storage/
│   ├── .env
│   └── .htaccess
│
├── assets/                 # Frontend Assets
│   ├── index-xxx.js
│   └── index-xxx.css
│
├── index.html              # Frontend Entry
└── .htaccess               # Frontend Routing
```

---

## URLs

- **Frontend:** https://hasetcompany.or.tz
- **Backend API:** https://hasetcompany.or.tz/api
- **Health Check:** https://hasetcompany.or.tz/api/health

---

## Support

If you encounter issues:
1. Check error logs in cPanel
2. Verify .env configuration
3. Test API endpoints manually
4. Check browser console for errors

---

**Status:** ✅ Hostinger Compatible  
**Node.js Required:** NO  
**Socket.io Required:** NO  
**Works on Shared Hosting:** YES  

---

**Last Updated:** November 21, 2025  
**Deployment:** Hostinger Ready 🚀
