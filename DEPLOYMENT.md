# Deployment Guide

## Quick Deployment Steps

### 1. Build the Application

```bash
npm run build
```

This creates a production-ready build in the `dist/` folder.

### 2. Upload Files

#### Frontend (dist/ folder)
Upload all contents of `dist/` to your web server's root directory (e.g., `public_html/`):
- index.html
- .htaccess
- assets/
- All other files

#### Backend (backend/ folder)
Upload the entire `backend/` folder to `public_html/api/`:
```
public_html/
└── api/          # Your Laravel backend
    ├── app/
    ├── bootstrap/
    ├── config/
    ├── database/
    ├── public/
    │   └── index.php
    ├── routes/
    ├── storage/
    └── ...
```

### 3. Configure Backend

Edit `public_html/api/.env`:

```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://yourdomain.com

DB_CONNECTION=mysql
DB_HOST=localhost
DB_DATABASE=your_database_name
DB_USERNAME=your_database_user
DB_PASSWORD=your_database_password
```

### 4. Run Backend Setup

SSH into your server:

```bash
cd public_html/api

# Install dependencies
composer install --no-dev --optimize-autoloader

# Run migrations
php artisan migrate --force

# Cache configuration
php artisan config:cache
php artisan route:cache

# Set permissions
chmod -R 755 storage bootstrap/cache
```

### 5. Verify Deployment

- Visit: `https://yourdomain.com` - Should load the app
- Visit: `https://yourdomain.com/api/health` - Should return `{"status":"ok"}`

## Troubleshooting

### API Not Working
1. Check `.htaccess` has the API routing rule
2. Verify backend is in `api/` folder
3. Check database credentials in `api/.env`
4. Clear Laravel cache: `php artisan config:clear`

### 500 Error
1. Check `api/storage/logs/laravel.log`
2. Verify file permissions on `storage/` and `bootstrap/cache/`
3. Make sure `.env` is configured correctly

### Database Connection Failed
1. Verify database credentials in `api/.env`
2. Make sure database exists
3. Check if database user has proper permissions

## Production Checklist

- [ ] Build frontend with `npm run build`
- [ ] Upload `dist/` contents to web root
- [ ] Upload `backend/` to `api/` folder
- [ ] Configure `api/.env` with production settings
- [ ] Run `composer install --no-dev`
- [ ] Run `php artisan migrate --force`
- [ ] Run `php artisan config:cache`
- [ ] Set proper file permissions
- [ ] Test login and basic functionality
- [ ] Verify API health endpoint
- [ ] Check browser console for errors

## Security Notes

- Never commit `.env` files
- Use strong database passwords
- Keep `APP_DEBUG=false` in production
- Regularly update dependencies
- Monitor `storage/logs/` for errors
