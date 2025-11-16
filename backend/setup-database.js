const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function setupDatabase() {
    try {
        console.log('Setting up database...\n');

        // Connect without database first
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            multipleStatements: true
        });

        console.log('✓ Connected to MySQL');

        // Create database first
        await connection.query('CREATE DATABASE IF NOT EXISTS hospital_db');
        console.log('✓ Database created');

        // Close and reconnect to the database
        await connection.end();

        const dbConnection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: 'hospital_db',
            multipleStatements: true
        });

        // Read and execute schema
        const schemaPath = path.join(__dirname, 'database', 'schema.sql');
        let schema = fs.readFileSync(schemaPath, 'utf8');
        
        // Remove CREATE DATABASE and USE statements
        schema = schema.replace(/CREATE DATABASE IF NOT EXISTS hospital_db;/g, '');
        schema = schema.replace(/USE hospital_db;/g, '');

        console.log('✓ Reading schema file');
        console.log('✓ Creating tables...');

        await dbConnection.query(schema);
        await dbConnection.end();

        console.log('✓ Database and tables created successfully');

        await connection.end();

        console.log('\n✅ Database setup complete!');
        console.log('\nNext step: Run "node create-admin.js" to create admin user');

    } catch (error) {
        console.error('❌ Error setting up database:', error.message);
        process.exit(1);
    }
}

setupDatabase();
