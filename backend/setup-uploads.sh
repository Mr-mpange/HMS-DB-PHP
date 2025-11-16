#!/bin/bash

# Setup script for file upload functionality

echo "🚀 Setting up file upload system..."

# Create uploads directory
echo "📁 Creating uploads directory..."
mkdir -p uploads
chmod 755 uploads

# Add upload table to database
echo "🗄️  Adding uploaded_files table to database..."
mysql -u root -p hospital_db < database/add-upload-table.sql

echo "✅ File upload system setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Ensure UPLOAD_PATH is set in .env (default: ./uploads)"
echo "2. Ensure MAX_FILE_SIZE is set in .env (default: 5MB)"
echo "3. Start the server: npm run dev"
echo "4. Test upload: See FILE_UPLOAD_GUIDE.md"
