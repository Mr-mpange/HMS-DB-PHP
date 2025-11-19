#!/usr/bin/env node

/**
 * Generate Production Secrets
 * Run: node generate-secrets.js
 */

const crypto = require('crypto');

console.log('\n========================================');
console.log('🔐 PRODUCTION SECRETS GENERATOR');
console.log('Domain: hasetcompany.or.tz');
console.log('========================================\n');

// Generate JWT Secret (64 bytes = 128 hex characters)
const jwtSecret = crypto.randomBytes(64).toString('hex');
console.log('JWT_SECRET (Copy this):');
console.log(jwtSecret);
console.log('');

// Generate Session Secret (64 bytes = 128 hex characters)
const sessionSecret = crypto.randomBytes(64).toString('hex');
console.log('SESSION_SECRET (Copy this):');
console.log(sessionSecret);
console.log('');

// Generate Database Password (24 bytes = 32 base64 characters)
const dbPassword = crypto.randomBytes(24).toString('base64');
console.log('DATABASE_PASSWORD (Copy this):');
console.log(dbPassword);
console.log('');

console.log('========================================');
console.log('⚠️  IMPORTANT:');
console.log('1. Save these secrets securely');
console.log('2. Never commit them to git');
console.log('3. Use them in your .env file');
console.log('4. Keep backups in a secure location');
console.log('========================================\n');

// Create sample .env content
console.log('📝 Sample .env file:\n');
console.log('# Database Configuration');
console.log('DB_HOST=localhost');
console.log('DB_USER=hasetcompany_db_user');
console.log(`DB_PASSWORD=${dbPassword}`);
console.log('DB_NAME=hasetcompany_hospital');
console.log('DB_PORT=3306');
console.log('');
console.log('# Database Connection Pool');
console.log('DB_CONNECTION_LIMIT=10');
console.log('DB_QUEUE_LIMIT=0');
console.log('DB_ACQUIRE_TIMEOUT=60000');
console.log('DB_TIMEOUT=60000');
console.log('');
console.log('# Server Configuration');
console.log('PORT=3000');
console.log('NODE_ENV=production');
console.log('');
console.log('# Security');
console.log(`JWT_SECRET=${jwtSecret}`);
console.log(`SESSION_SECRET=${sessionSecret}`);
console.log('');
console.log('# Domain');
console.log('FRONTEND_URL=https://hasetcompany.or.tz');
console.log('CORS_ORIGINS=https://hasetcompany.or.tz,https://www.hasetcompany.or.tz');
console.log('');
console.log('========================================\n');
