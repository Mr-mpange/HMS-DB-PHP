const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkUsersTable() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: 'hospital_db'
        });

        const [columns] = await connection.execute('DESCRIBE users');
        console.log('Users table structure:');
        console.table(columns);

        await connection.end();
    } catch (error) {
        console.error('Error:', error.message);
    }
}

checkUsersTable();
