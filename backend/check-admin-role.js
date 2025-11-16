const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkAdminRole() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: 'hospital_db'
        });

        const [users] = await connection.execute(
            `SELECT u.*, GROUP_CONCAT(ur.role) as roles
             FROM users u
             LEFT JOIN user_roles ur ON u.id = ur.user_id
             WHERE u.email = 'admin@hospital.com'
             GROUP BY u.id`
        );

        console.log('Admin user:');
        console.table(users);

        await connection.end();
    } catch (error) {
        console.error('Error:', error.message);
    }
}

checkAdminRole();
