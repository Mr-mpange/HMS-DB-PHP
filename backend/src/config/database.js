const mysql = require('mysql2/promise');
require('dotenv').config();

// Production-grade connection pool configuration
const poolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'hospital_db',
  
  // Connection Pool Settings (Prevents crashes under load)
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
  queueLimit: parseInt(process.env.DB_QUEUE_LIMIT) || 0,
  
  // Keep-Alive Settings (Prevents connection drops)
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  
  // Idle Connection Management
  maxIdle: 10,
  idleTimeout: 60000, // 60 seconds
  
  // Timeout Settings (Prevents hanging connections)
  connectTimeout: 10000, // 10 seconds
  acquireTimeout: parseInt(process.env.DB_ACQUIRE_TIMEOUT) || 60000, // 60 seconds
  timeout: parseInt(process.env.DB_TIMEOUT) || 60000, // 60 seconds
  
  // Character Set
  charset: 'utf8mb4',
  
  // Timezone
  timezone: '+03:00', // East Africa Time (EAT)
  
  // Date Strings (Prevents timezone issues)
  dateStrings: true,
  
  // Multiple Statements (Security - disabled)
  multipleStatements: false,
  
  // Reconnection
  reconnect: true
};

// Create connection pool
const pool = mysql.createPool(poolConfig);

// Connection error handler
pool.on('error', (err) => {
  console.error('❌ Database pool error:', err.message);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.log('🔄 Database connection lost. Pool will reconnect automatically.');
  } else if (err.code === 'ER_CON_COUNT_ERROR') {
    console.error('⚠️ Too many database connections!');
  } else if (err.code === 'ECONNREFUSED') {
    console.error('⚠️ Database connection refused!');
  }
});

// Test initial connection
pool.getConnection()
  .then(connection => {
    console.log('✅ Database connected successfully');
    console.log(`📊 Pool: ${poolConfig.connectionLimit} connections, Queue: ${poolConfig.queueLimit === 0 ? 'unlimited' : poolConfig.queueLimit}`);
    connection.release();
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err.message);
    console.error('💡 Check your database credentials in .env file');
    if (process.env.NODE_ENV === 'production') {
      console.error('⚠️ Production mode: Exiting...');
      process.exit(1);
    }
  });

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  try {
    await pool.end();
    console.log('✅ Database connections closed');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error closing database:', err.message);
    process.exit(1);
  }
});

module.exports = pool;
