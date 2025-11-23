#!/bin/bash

echo "Setting up Laravel WebSockets (Reverb)..."

# Install Laravel Reverb
composer require laravel/reverb

# Publish configuration
php artisan reverb:install

# Add to .env if not exists
if ! grep -q "BROADCAST_CONNECTION" .env; then
    echo "" >> .env
    echo "# Broadcasting Configuration" >> .env
    echo "BROADCAST_CONNECTION=reverb" >> .env
    echo "REVERB_APP_ID=hospital-app" >> .env
    echo "REVERB_APP_KEY=local-key" >> .env
    echo "REVERB_APP_SECRET=local-secret" >> .env
    echo "REVERB_HOST=localhost" >> .env
    echo "REVERB_PORT=8080" >> .env
    echo "REVERB_SCHEME=http" >> .env
fi

echo "WebSocket setup complete!"
echo "Run: php artisan reverb:start"
