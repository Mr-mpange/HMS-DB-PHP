#!/bin/bash

# Database Backup Script for Hospital Management System

set -e

# Configuration
BACKUP_DIR="./backups/mysql"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/hospital_db_$DATE.sql"
RETENTION_DAYS=7

# Load environment variables
if [ -f .env ]; then
    source .env
fi

# Create backup directory
mkdir -p $BACKUP_DIR

echo "Starting database backup..."
echo "Backup file: $BACKUP_FILE"

# Backup database
if command -v docker-compose &> /dev/null; then
    # Docker deployment
    docker-compose exec -T mysql mysqldump \
        -u root \
        -p${DB_ROOT_PASSWORD} \
        ${DB_NAME:-hospital_db_prod} > $BACKUP_FILE
else
    # Manual deployment
    mysqldump \
        -h ${DB_HOST:-localhost} \
        -u ${DB_USER:-root} \
        -p${DB_PASSWORD} \
        ${DB_NAME:-hospital_db_prod} > $BACKUP_FILE
fi

# Compress backup
gzip $BACKUP_FILE
echo "Backup compressed: $BACKUP_FILE.gz"

# Remove old backups
find $BACKUP_DIR -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete
echo "Old backups removed (older than $RETENTION_DAYS days)"

# Calculate backup size
BACKUP_SIZE=$(du -h "$BACKUP_FILE.gz" | cut -f1)
echo "Backup completed successfully!"
echo "Size: $BACKUP_SIZE"
echo "Location: $BACKUP_FILE.gz"

# Optional: Upload to cloud storage
# aws s3 cp "$BACKUP_FILE.gz" s3://your-bucket/backups/
# gsutil cp "$BACKUP_FILE.gz" gs://your-bucket/backups/
