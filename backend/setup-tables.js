const mysql = require('mysql2/promise');
require('dotenv').config();

async function setupTables() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: 'hospital_db'
        });

        console.log('Creating tables...\n');

        // Drop existing tables if needed (in correct order due to foreign keys)
        const dropTables = [
            'DROP TABLE IF EXISTS file_uploads',
            'DROP TABLE IF EXISTS payments',
            'DROP TABLE IF EXISTS invoices',
            'DROP TABLE IF EXISTS medication_dispensing',
            'DROP TABLE IF EXISTS medications',
            'DROP TABLE IF EXISTS lab_results',
            'DROP TABLE IF EXISTS lab_tests',
            'DROP TABLE IF EXISTS prescriptions',
            'DROP TABLE IF EXISTS appointments',
            'DROP TABLE IF EXISTS patient_visits',
            'DROP TABLE IF EXISTS activity_logs',
            'DROP TABLE IF EXISTS sessions',
            'DROP TABLE IF EXISTS profiles',
            'DROP TABLE IF EXISTS user_roles',
            'DROP TABLE IF EXISTS patients'
        ];

        for (const drop of dropTables) {
            await connection.execute(drop);
        }

        // Create user_roles table
        await connection.execute(`
            CREATE TABLE user_roles (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
                role ENUM('admin', 'doctor', 'nurse', 'lab_tech', 'pharmacist', 'billing', 'receptionist') NOT NULL,
                is_primary BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_user_id (user_id),
                INDEX idx_role (role),
                UNIQUE KEY unique_user_role (user_id, role)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✓ user_roles table created');

        // Create profiles table
        await connection.execute(`
            CREATE TABLE profiles (
                id CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci PRIMARY KEY,
                user_id CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci UNIQUE NOT NULL,
                full_name VARCHAR(255),
                email VARCHAR(255),
                phone VARCHAR(20),
                avatar_url VARCHAR(500),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_user_id (user_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✓ profiles table created');

        // Create patients table
        await connection.execute(`
            CREATE TABLE patients (
                id CHAR(36) PRIMARY KEY,
                full_name VARCHAR(255) NOT NULL,
                date_of_birth DATE,
                gender ENUM('Male', 'Female', 'Other'),
                phone VARCHAR(20),
                email VARCHAR(255),
                address TEXT,
                emergency_contact VARCHAR(255),
                emergency_phone VARCHAR(20),
                blood_group VARCHAR(10),
                allergies TEXT,
                medical_history TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_phone (phone),
                INDEX idx_email (email),
                INDEX idx_name (full_name)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✓ patients table created');

        // Create patient_visits table
        await connection.execute(`
            CREATE TABLE patient_visits (
                id CHAR(36) PRIMARY KEY,
                patient_id CHAR(36) NOT NULL,
                visit_date DATE NOT NULL,
                visit_type ENUM('OPD', 'Emergency', 'Follow-up', 'Consultation') DEFAULT 'OPD',
                current_stage ENUM('reception', 'nurse', 'doctor', 'lab', 'pharmacy', 'billing', 'completed') DEFAULT 'reception',
                overall_status ENUM('Active', 'Completed', 'Cancelled') DEFAULT 'Active',
                chief_complaint TEXT,
                vital_signs JSON,
                diagnosis TEXT,
                treatment_plan TEXT,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
                INDEX idx_patient_id (patient_id),
                INDEX idx_visit_date (visit_date),
                INDEX idx_current_stage (current_stage),
                INDEX idx_overall_status (overall_status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✓ patient_visits table created');

        // Create appointments table
        await connection.execute(`
            CREATE TABLE appointments (
                id CHAR(36) PRIMARY KEY,
                patient_id CHAR(36) NOT NULL,
                doctor_id CHAR(36),
                appointment_date DATETIME NOT NULL,
                duration INT DEFAULT 30,
                type ENUM('Consultation', 'Follow-up', 'Emergency', 'Routine') DEFAULT 'Consultation',
                status ENUM('Scheduled', 'Confirmed', 'In Progress', 'Completed', 'Cancelled', 'No Show') DEFAULT 'Scheduled',
                reason TEXT,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
                FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE SET NULL,
                INDEX idx_patient_id (patient_id),
                INDEX idx_doctor_id (doctor_id),
                INDEX idx_appointment_date (appointment_date),
                INDEX idx_status (status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✓ appointments table created');

        // Create prescriptions table
        await connection.execute(`
            CREATE TABLE prescriptions (
                id CHAR(36) PRIMARY KEY,
                patient_id CHAR(36) NOT NULL,
                doctor_id CHAR(36),
                visit_id CHAR(36),
                prescription_date DATE NOT NULL,
                medications JSON,
                instructions TEXT,
                status ENUM('Active', 'Completed', 'Cancelled') DEFAULT 'Active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
                FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE SET NULL,
                FOREIGN KEY (visit_id) REFERENCES patient_visits(id) ON DELETE SET NULL,
                INDEX idx_patient_id (patient_id),
                INDEX idx_doctor_id (doctor_id),
                INDEX idx_visit_id (visit_id),
                INDEX idx_status (status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✓ prescriptions table created');

        // Create lab_tests table
        await connection.execute(`
            CREATE TABLE lab_tests (
                id CHAR(36) PRIMARY KEY,
                patient_id CHAR(36) NOT NULL,
                doctor_id CHAR(36),
                visit_id CHAR(36),
                test_name VARCHAR(255) NOT NULL,
                test_type VARCHAR(100),
                ordered_date DATETIME NOT NULL,
                sample_collected BOOLEAN DEFAULT FALSE,
                status ENUM('Ordered', 'Sample Collected', 'In Progress', 'Completed', 'Cancelled') DEFAULT 'Ordered',
                priority ENUM('Routine', 'Urgent', 'STAT') DEFAULT 'Routine',
                instructions TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
                FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE SET NULL,
                FOREIGN KEY (visit_id) REFERENCES patient_visits(id) ON DELETE SET NULL,
                INDEX idx_patient_id (patient_id),
                INDEX idx_doctor_id (doctor_id),
                INDEX idx_visit_id (visit_id),
                INDEX idx_status (status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✓ lab_tests table created');

        // Create lab_results table
        await connection.execute(`
            CREATE TABLE lab_results (
                id CHAR(36) PRIMARY KEY,
                lab_test_id CHAR(36) NOT NULL,
                result_data JSON,
                result_text TEXT,
                performed_by CHAR(36),
                performed_date DATETIME,
                verified_by CHAR(36),
                verified_date DATETIME,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (lab_test_id) REFERENCES lab_tests(id) ON DELETE CASCADE,
                FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE SET NULL,
                FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL,
                INDEX idx_lab_test_id (lab_test_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✓ lab_results table created');

        // Create medications table
        await connection.execute(`
            CREATE TABLE medications (
                id CHAR(36) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                generic_name VARCHAR(255),
                category VARCHAR(100),
                dosage_form VARCHAR(100),
                strength VARCHAR(50),
                unit VARCHAR(20),
                stock_quantity INT DEFAULT 0,
                reorder_level INT DEFAULT 10,
                unit_price DECIMAL(10, 2),
                manufacturer VARCHAR(255),
                expiry_date DATE,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_name (name),
                INDEX idx_category (category),
                INDEX idx_stock_quantity (stock_quantity)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✓ medications table created');

        // Create medication_dispensing table
        await connection.execute(`
            CREATE TABLE medication_dispensing (
                id CHAR(36) PRIMARY KEY,
                prescription_id CHAR(36) NOT NULL,
                medication_id CHAR(36) NOT NULL,
                quantity INT NOT NULL,
                dispensed_by CHAR(36),
                dispensed_date DATETIME,
                status ENUM('Pending', 'Dispensed', 'Cancelled') DEFAULT 'Pending',
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (prescription_id) REFERENCES prescriptions(id) ON DELETE CASCADE,
                FOREIGN KEY (medication_id) REFERENCES medications(id) ON DELETE CASCADE,
                FOREIGN KEY (dispensed_by) REFERENCES users(id) ON DELETE SET NULL,
                INDEX idx_prescription_id (prescription_id),
                INDEX idx_medication_id (medication_id),
                INDEX idx_status (status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✓ medication_dispensing table created');

        // Create invoices table
        await connection.execute(`
            CREATE TABLE invoices (
                id CHAR(36) PRIMARY KEY,
                patient_id CHAR(36) NOT NULL,
                visit_id CHAR(36),
                invoice_number VARCHAR(50) UNIQUE NOT NULL,
                invoice_date DATE NOT NULL,
                due_date DATE,
                total_amount DECIMAL(10, 2) NOT NULL,
                paid_amount DECIMAL(10, 2) DEFAULT 0,
                balance DECIMAL(10, 2) NOT NULL,
                status ENUM('Pending', 'Partially Paid', 'Paid', 'Cancelled') DEFAULT 'Pending',
                items JSON,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
                FOREIGN KEY (visit_id) REFERENCES patient_visits(id) ON DELETE SET NULL,
                INDEX idx_patient_id (patient_id),
                INDEX idx_visit_id (visit_id),
                INDEX idx_invoice_number (invoice_number),
                INDEX idx_status (status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✓ invoices table created');

        // Create payments table
        await connection.execute(`
            CREATE TABLE payments (
                id CHAR(36) PRIMARY KEY,
                invoice_id CHAR(36) NOT NULL,
                payment_date DATETIME NOT NULL,
                amount DECIMAL(10, 2) NOT NULL,
                payment_method ENUM('Cash', 'Card', 'Mobile Money', 'Bank Transfer', 'Insurance') NOT NULL,
                reference_number VARCHAR(100),
                received_by CHAR(36),
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
                FOREIGN KEY (received_by) REFERENCES users(id) ON DELETE SET NULL,
                INDEX idx_invoice_id (invoice_id),
                INDEX idx_payment_date (payment_date)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✓ payments table created');

        // Create file_uploads table
        await connection.execute(`
            CREATE TABLE file_uploads (
                id CHAR(36) PRIMARY KEY,
                filename VARCHAR(255) NOT NULL,
                original_name VARCHAR(255) NOT NULL,
                mimetype VARCHAR(100) NOT NULL,
                size INT NOT NULL,
                path VARCHAR(500) NOT NULL,
                uploaded_by CHAR(36),
                entity_type VARCHAR(50),
                entity_id CHAR(36),
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL,
                INDEX idx_entity (entity_type, entity_id),
                INDEX idx_uploaded_by (uploaded_by)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✓ file_uploads table created');

        // Create sessions table
        await connection.execute(`
            CREATE TABLE sessions (
                id CHAR(36) PRIMARY KEY,
                user_id CHAR(36) NOT NULL,
                token TEXT NOT NULL,
                expires_at DATETIME NOT NULL,
                ip_address VARCHAR(45),
                user_agent TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_user_id (user_id),
                INDEX idx_expires_at (expires_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✓ sessions table created');

        // Create activity_logs table
        await connection.execute(`
            CREATE TABLE activity_logs (
                id CHAR(36) PRIMARY KEY,
                user_id CHAR(36),
                action VARCHAR(100) NOT NULL,
                details JSON,
                ip_address VARCHAR(45),
                user_agent TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
                INDEX idx_user_id (user_id),
                INDEX idx_action (action),
                INDEX idx_created_at (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✓ activity_logs table created');

        await connection.end();

        console.log('\n✅ All tables created successfully!');
        console.log('\nNext step: Run "node create-admin.js" to create admin user');

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

setupTables();
