const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');

async function setupMedicalServices() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hospital_db'
  });

  console.log('✅ Connected to database\n');

  try {
    // Check if table exists
    const [tables] = await connection.execute(
      "SHOW TABLES LIKE 'medical_services'"
    );

    if (tables.length > 0) {
      console.log('⚠️  medical_services table already exists');
      const [count] = await connection.execute('SELECT COUNT(*) as count FROM medical_services');
      console.log(`   Current records: ${count[0].count}\n`);
      
      // Ask if we should continue
      console.log('Proceeding to add sample data if not exists...\n');
    } else {
      console.log('=== CREATING MEDICAL_SERVICES TABLE ===\n');
      
      // Create table
      await connection.execute(`
        CREATE TABLE medical_services (
          id VARCHAR(36) PRIMARY KEY,
          service_code VARCHAR(50) UNIQUE NOT NULL,
          service_name VARCHAR(255) NOT NULL,
          service_type ENUM('Consultation', 'Procedure', 'Surgery', 'Emergency', 'Ward Stay', 'Laboratory', 'Radiology', 'Pharmacy', 'Other') NOT NULL,
          description TEXT,
          base_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
          currency VARCHAR(10) DEFAULT 'TSh',
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_service_code (service_code),
          INDEX idx_service_type (service_type),
          INDEX idx_is_active (is_active)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      
      console.log('✅ Table created successfully\n');
    }

    // Insert sample services
    console.log('=== INSERTING SAMPLE SERVICES ===\n');
    
    const services = [
      ['CONS-001', 'General Consultation', 'Consultation', 'General doctor consultation', 50000],
      ['CONS-002', 'Specialist Consultation', 'Consultation', 'Specialist doctor consultation', 75000],
      ['CONS-003', 'Follow-up Consultation', 'Consultation', 'Follow-up visit with doctor', 30000],
      ['PROC-001', 'Blood Test', 'Laboratory', 'Complete blood count test', 25000],
      ['PROC-002', 'Urine Test', 'Laboratory', 'Urinalysis test', 15000],
      ['PROC-003', 'X-Ray', 'Radiology', 'X-ray imaging', 40000],
      ['PROC-004', 'Ultrasound', 'Radiology', 'Ultrasound scan', 60000],
      ['PROC-005', 'ECG', 'Procedure', 'Electrocardiogram', 35000],
      ['PROC-006', 'Blood Pressure Check', 'Procedure', 'Blood pressure measurement', 5000],
      ['PROC-007', 'Glucose Test', 'Laboratory', 'Blood glucose test', 20000],
      ['PROC-008', 'Malaria Test', 'Laboratory', 'Rapid malaria test', 15000],
      ['PROC-009', 'HIV Test', 'Laboratory', 'HIV screening test', 25000],
      ['PROC-010', 'Pregnancy Test', 'Laboratory', 'Pregnancy test', 10000],
      ['SURG-001', 'Minor Surgery', 'Surgery', 'Minor surgical procedure', 150000],
      ['SURG-002', 'Major Surgery', 'Surgery', 'Major surgical procedure', 500000],
      ['SURG-003', 'Wound Dressing', 'Surgery', 'Wound cleaning and dressing', 20000],
      ['SURG-004', 'Suturing', 'Surgery', 'Wound suturing', 30000],
      ['EMER-001', 'Emergency Care', 'Emergency', 'Emergency room visit', 100000],
      ['EMER-002', 'Ambulance Service', 'Emergency', 'Emergency ambulance transport', 50000],
      ['WARD-001', 'General Ward', 'Ward Stay', 'General ward per day', 75000],
      ['WARD-002', 'Private Ward', 'Ward Stay', 'Private ward per day', 150000],
      ['WARD-003', 'ICU', 'Ward Stay', 'Intensive care unit per day', 300000],
      ['WARD-004', 'Maternity Ward', 'Ward Stay', 'Maternity ward per day', 100000],
      ['PHARM-001', 'Medication Dispensing', 'Pharmacy', 'Pharmacy dispensing fee', 5000],
      ['OTHER-001', 'Medical Certificate', 'Other', 'Medical certificate issuance', 10000],
      ['OTHER-002', 'Vaccination', 'Other', 'Vaccination service', 30000]
    ];

    let inserted = 0;
    let skipped = 0;

    for (const [code, name, type, desc, price] of services) {
      try {
        // Check if service already exists
        const [existing] = await connection.execute(
          'SELECT id FROM medical_services WHERE service_code = ?',
          [code]
        );

        if (existing.length === 0) {
          await connection.execute(
            'INSERT INTO medical_services (id, service_code, service_name, service_type, description, base_price, currency, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [uuidv4(), code, name, type, desc, price, 'TSh', true]
          );
          console.log(`✅ Inserted: ${code} - ${name} (TSh ${price})`);
          inserted++;
        } else {
          console.log(`⏭️  Skipped: ${code} - ${name} (already exists)`);
          skipped++;
        }
      } catch (error) {
        console.error(`❌ Error inserting ${code}:`, error.message);
      }
    }

    console.log(`\n=== SUMMARY ===`);
    console.log(`✅ Inserted: ${inserted} services`);
    console.log(`⏭️  Skipped: ${skipped} services (already exist)`);
    console.log(`📊 Total: ${services.length} services processed\n`);

    // Show final count
    const [finalCount] = await connection.execute('SELECT COUNT(*) as count FROM medical_services');
    console.log(`📋 Total services in database: ${finalCount[0].count}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

setupMedicalServices();
