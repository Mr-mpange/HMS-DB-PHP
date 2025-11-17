const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

async function testActivityLogs() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: 'hospital_db'
    });

    console.log('✅ Connected to database\n');

    // Check existing logs
    const [logs] = await connection.execute(
      'SELECT COUNT(*) as count FROM activity_logs'
    );
    console.log(`📊 Current activity logs count: ${logs[0].count}\n`);

    if (logs[0].count === 0) {
      console.log('No activity logs found. Creating sample logs...\n');

      // Get a user ID to use
      const [users] = await connection.execute('SELECT id FROM users LIMIT 1');
      
      if (users.length === 0) {
        console.log('❌ No users found. Please create a user first.');
        await connection.end();
        return;
      }

      const userId = users[0].id;
      console.log(`Using user ID: ${userId}\n`);

      // Create sample activity logs
      const sampleLogs = [
        { action: 'user.login', details: { ip: '127.0.0.1', browser: 'Chrome' } },
        { action: 'patient.created', details: { patient_name: 'John Doe' } },
        { action: 'appointment.created', details: { appointment_date: new Date().toISOString() } },
        { action: 'prescription.created', details: { medication_count: 3 } },
        { action: 'lab_test.ordered', details: { test_name: 'Blood Test' } },
        { action: 'payment.received', details: { amount: 50000, method: 'Cash' } },
        { action: 'user.logout', details: { session_duration: '2 hours' } }
      ];

      for (const log of sampleLogs) {
        await connection.execute(
          `INSERT INTO activity_logs (id, user_id, action, details, ip_address, created_at) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            uuidv4(),
            userId,
            log.action,
            JSON.stringify(log.details),
            '127.0.0.1',
            new Date()
          ]
        );
        console.log(`✅ Created log: ${log.action}`);
      }

      console.log('\n✅ Sample activity logs created successfully!');
    } else {
      console.log('Activity logs already exist. Showing recent logs:\n');
      
      const [recentLogs] = await connection.execute(
        `SELECT al.*, u.email, u.full_name 
         FROM activity_logs al
         LEFT JOIN users u ON al.user_id = u.id
         ORDER BY al.created_at DESC
         LIMIT 10`
      );

      recentLogs.forEach((log, index) => {
        console.log(`${index + 1}. ${log.action} by ${log.full_name || log.email || 'Unknown'} at ${log.created_at}`);
      });
    }

    await connection.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testActivityLogs();
