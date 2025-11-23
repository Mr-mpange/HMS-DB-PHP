# Laravel WebSocket Setup for Real-Time Updates

## Quick Setup (No Page Refresh!)

### Step 1: Install Dependencies

```bash
cd backend

# Install Laravel Echo Server (simpler than Reverb for local dev)
npm install -g laravel-echo-server

# Or use Pusher (free tier available)
composer require pusher/pusher-php-server
```

### Step 2: Configure Broadcasting

Add to `backend/.env`:

```env
BROADCAST_CONNECTION=pusher

# For local development with laravel-echo-server
PUSHER_APP_ID=local
PUSHER_APP_KEY=local-key
PUSHER_APP_SECRET=local-secret
PUSHER_APP_CLUSTER=mt1
PUSHER_HOST=127.0.0.1
PUSHER_PORT=6001
PUSHER_SCHEME=http

# For production with Pusher.com
# PUSHER_APP_ID=your-app-id
# PUSHER_APP_KEY=your-key
# PUSHER_APP_SECRET=your-secret
# PUSHER_APP_CLUSTER=ap2
```

### Step 3: Initialize Laravel Echo Server

```bash
cd backend
laravel-echo-server init
```

Answer the questions:
- Do you want to run this server in development mode? **Yes**
- Which port would you like to serve from? **6001**
- Which database would you like to use? **redis** (or sqlite for simplicity)
- Would you like to generate a client ID/Key for HTTP API? **Yes**

### Step 4: Start WebSocket Server

```bash
# Terminal 1: Laravel backend
cd backend
php artisan serve

# Terminal 2: WebSocket server
cd backend
laravel-echo-server start
```

### Step 5: Frontend Setup

The frontend code is already created in `src/hooks/useWebSocket.ts`

## Alternative: Simple Pusher Setup (Recommended)

### 1. Sign up for free Pusher account
- Go to https://pusher.com
- Create free account (100 connections, 200k messages/day)
- Create new app
- Copy credentials

### 2. Update backend/.env

```env
BROADCAST_CONNECTION=pusher
PUSHER_APP_ID=your-app-id
PUSHER_APP_KEY=your-key
PUSHER_APP_SECRET=your-secret
PUSHER_APP_CLUSTER=ap2
```

### 3. That's it!

No need to run separate WebSocket server. Pusher handles everything.

## Testing

1. Open Doctor Dashboard
2. Open another browser/tab as Receptionist
3. Check in a patient
4. Doctor Dashboard updates instantly (no refresh!)

## Benefits

✅ **Instant Updates** - No polling, no delays
✅ **No Page Refresh** - Smooth real-time experience  
✅ **Low Server Load** - WebSockets use less resources
✅ **Scalable** - Handles many concurrent users
✅ **Production Ready** - Battle-tested technology

## Troubleshooting

### WebSocket not connecting?
- Check if laravel-echo-server is running
- Check firewall allows port 6001
- Check PUSHER_* env variables are set

### Events not broadcasting?
- Check `BROADCAST_CONNECTION=pusher` in .env
- Run `php artisan config:clear`
- Check Laravel logs

### Still using polling?
- The system falls back to polling if WebSocket fails
- This ensures the app always works
