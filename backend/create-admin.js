const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function createAdminUser() {
    try {
        // Create database connection
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'hospital_db'
        });

        console.log('Connected to database');

        // Hash the password
        const password = 'admin123';
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert admin user
        const [userResult] = await connection.execute(
            `INSERT INTO users (id, email, password_hash, full_name, phone, is_active, email_verified)
             VALUES (UUID(), ?, ?, ?, ?, TRUE, TRUE)
             ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)`,
            ['admin@hospital.com', hashedPassword, 'System Administrator', '1234567890']
        );

        // Get admin user ID
        const [users] = await connection.execute(
            'SELECT id FROM users WHERE email = ?',
            ['admin@hospital.com']
        );

        const adminId = users[0].id;
        console.log('Admin user created/updated:', adminId);

        // Assign admin role
        await connection.execute(
            `INSERT INTO user_roles (user_id, role, is_primary)
             VALUES (?, 'admin', TRUE)
             ON DUPLICATE KEY UPDATE is_primary = TRUE`,
            [adminId]
        );

        console.log('Admin role assigned');

        // Create profile
        await connection.execute(
            `INSERT INTO profiles (id, user_id, full_name, email, phone)
             VALUES (UUID(), ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE full_name = VALUES(full_name)`,
            [adminId, 'System Administrator', 'admin@hospital.com', '1234567890']
        );

        console.log('Admin profile created');

        // Create doctor user
        const doctorPassword = await bcrypt.hash('doctor123', 10);
        await connection.execute(
            `INSERT INTO users (id, email, password_hash, full_name, phone, is_active, email_verified)
             VALUES (UUID(), ?, ?, ?, ?, TRUE, TRUE)
             ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)`,
            ['doctor@hospital.com', doctorPassword, 'Dr. John Smith', '1234567891']
        );

        const [doctors] = await connection.execute(
            'SELECT id FROM users WHERE email = ?',
            ['doctor@hospital.com']
        );

        const doctorId = doctors[0].id;
        await connection.execute(
            `INSERT INTO user_roles (user_id, role, is_primary)
             VALUES (?, 'doctor', TRUE)
             ON DUPLICATE KEY UPDATE is_primary = TRUE`,
            [doctorId]
        );

        await connection.execute(
            `INSERT INTO profiles (id, user_id, full_name, email, phone)
             VALUES (UUID(), ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE full_name = VALUES(full_name)`,
            [doctorId, 'Dr. John Smith', 'doctor@hospital.com', '1234567891']
        );

        console.log('Doctor user created');

        console.log('\n✅ All users created successfully!');
        console.log('\nLogin credentials:');
        console.log('Admin: admin@hospital.com / admin123');
        console.log('Doctor: doctor@hospital.com / doctor123');

        await connection.end();
    } catch (error) {
        console.error('Error creating admin user:', error);
        process.exit(1);
    }
}

createAdminUser();
