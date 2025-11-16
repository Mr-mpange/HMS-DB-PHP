const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

async function createLabTestData() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'hospital_db'
    });

    console.log('Connected to database\n');

    // Get a patient and doctor
    const [patients] = await connection.query('SELECT id FROM patients LIMIT 1');
    const [doctors] = await connection.query(
      `SELECT u.id FROM users u 
       INNER JOIN user_roles ur ON u.id = ur.user_id 
       WHERE ur.role = 'doctor' LIMIT 1`
    );

    if (patients.length === 0) {
      console.log('❌ No patients found. Please create a patient first.');
      await connection.end();
      return;
    }

    if (doctors.length === 0) {
      console.log('❌ No doctors found. Please create a doctor user first.');
      await connection.end();
      return;
    }

    const patientId = patients[0].id;
    const doctorId = doctors[0].id;

    console.log(`Using patient: ${patientId}`);
    console.log(`Using doctor: ${doctorId}\n`);

    // Common lab tests
    const labTests = [
      { name: 'Complete Blood Count (CBC)', type: 'Hematology', priority: 'Routine' },
      { name: 'Blood Glucose (Fasting)', type: 'Chemistry', priority: 'Routine' },
      { name: 'Lipid Profile', type: 'Chemistry', priority: 'Routine' },
      { name: 'Liver Function Test (LFT)', type: 'Chemistry', priority: 'Routine' },
      { name: 'Kidney Function Test (KFT)', type: 'Chemistry', priority: 'Routine' },
      { name: 'Thyroid Function Test (TFT)', type: 'Endocrinology', priority: 'Routine' },
      { name: 'Urinalysis', type: 'Urinalysis', priority: 'Routine' },
      { name: 'Malaria Test (RDT)', type: 'Microbiology', priority: 'STAT' },
      { name: 'HIV Test', type: 'Serology', priority: 'Routine' },
      { name: 'Hepatitis B Surface Antigen', type: 'Serology', priority: 'Routine' },
      { name: 'Blood Group & Rh', type: 'Immunohematology', priority: 'Urgent' },
      { name: 'Pregnancy Test (HCG)', type: 'Immunology', priority: 'Urgent' },
      { name: 'Stool Analysis', type: 'Microbiology', priority: 'Routine' },
      { name: 'Sputum for AFB', type: 'Microbiology', priority: 'Routine' },
      { name: 'X-Ray Chest', type: 'Radiology', priority: 'Routine' }
    ];

    let created = 0;
    const now = new Date();

    for (const test of labTests) {
      const testId = uuidv4();
      
      await connection.query(
        `INSERT INTO lab_tests (
          id, patient_id, doctor_id, test_name, test_type, 
          ordered_date, status, priority, sample_collected
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          testId,
          patientId,
          doctorId,
          test.name,
          test.type,
          now,
          'Ordered',
          test.priority,
          0
        ]
      );

      created++;
      console.log(`✅ Created: ${test.name} (${test.type})`);
    }

    console.log(`\n✅ Successfully created ${created} lab tests`);
    await connection.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createLabTestData();
