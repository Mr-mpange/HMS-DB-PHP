const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkTables() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: 'hospital_db'
        });

        const [tables] = await connection.execute('SHOW TABLES');
        console.log('Tables in hospital_db:');
        tables.forEach(table => {
            console.log('-', Object.values(table)[0]);
        });

        await connection.end();
    } catch (error) {
        console.error('Error:', error.message);
    }
}

checkTables();
