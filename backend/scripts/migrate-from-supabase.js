/**
 * Data Migration Script: Supabase to MySQL
 * 
 * This script exports data from Supabase and imports it into MySQL
 * 
 * Usage:
 * 1. Set SUPABASE_URL and SUPABASE_KEY in .env
 * 2. Run: node scripts/migrate-from-supabase.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_KEY || ''
);

// MySQL connection
const mysqlConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'hospital_db'
};

// Tables to migrate (in order due to foreign keys)
const TABLES = [
  'patients',
  'patient_visits',
  'appointments',
  'medications',
  'prescriptions',
  'lab_tests',
  'lab_results',
  'medical_services',
  'invoices',
  'invoice_items',
  'payments',
  'activity_logs'
];

async function exportFromSupabase(tableName) {
  console.log(`📤 Exporting ${tableName} from Supabase...`);
  
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*');
    
    if (error) {
      console.error(`❌ Error exporting ${tableName}:`, error.message);
      return [];
    }
    
    console.log(`✅ Exported ${data.length} records from ${tableName}`);
    return data;
  } catch (error) {
    console.error(`❌ Error exporting ${tableName}:`, error.message);
    return [];
  }
}

async function importToMySQL(connection, tableName, data) {
  if (data.length === 0) {
    console.log(`⏭️  Skipping ${tableName} (no data)`);
    return;
  }
  
  console.log(`📥 Importing ${data.length} records to ${tableName}...`);
  
  try {
    for (const row of data) {
      const columns = Object.keys(row).join(', ');
      const placeholders = Object.keys(row).map(() => '?').join(', ');
      const values = Object.values(row).map(val => {
        // Handle JSON fields
        if (typeof val === 'object' && val !== null) {
          return JSON.stringify(val);
        }
        return val;
      });
      
      const query = `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders})`;
      
      try {
        await connection.execute(query, values);
      } catch (error) {
        // Skip duplicates
        if (error.code === 'ER_DUP_ENTRY') {
          console.log(`⚠️  Skipping duplicate in ${tableName}`);
        } else {
          console.error(`❌ Error inserting into ${tableName}:`, error.message);
        }
      }
    }
    
    console.log(`✅ Imported ${data.length} records to ${tableName}`);
  } catch (error) {
    console.error(`❌ Error importing to ${tableName}:`, error.message);
  }
}

async function migrateUsers(connection) {
  console.log('\n👥 Migrating users...');
  
  try {
    // Get profiles from Supabase
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*');
    
    if (error) {
      console.error('❌ Error fetching profiles:', error.message);
      return;
    }
    
    console.log(`Found ${profiles.length} profiles`);
    
    for (const profile of profiles) {
      // Create user in MySQL
      const userId = profile.id || uuidv4();
      
      // Check if user exists
      const [existing] = await connection.execute(
        'SELECT id FROM users WHERE id = ?',
        [userId]
      );
      
      if (existing.length > 0) {
        console.log(`⏭️  User ${profile.email} already exists`);
        continue;
      }
      
      // Insert user (with default password - they'll need to reset)
      await connection.execute(
        `INSERT INTO users (id, email, password_hash, full_name, phone, is_active) 
         VALUES (?, ?, ?, ?, ?, TRUE)`,
        [
          userId,
          profile.email || `user${userId}@hospital.com`,
          '$2b$10$defaulthash', // Default hash - users need to reset password
          profile.full_name,
          profile.phone
        ]
      );
      
      // Insert profile
      await connection.execute(
        `INSERT INTO profiles (id, user_id, full_name, email, phone) 
         VALUES (?, ?, ?, ?, ?)`,
        [uuidv4(), userId, profile.full_name, profile.email, profile.phone]
      );
      
      console.log(`✅ Migrated user: ${profile.email}`);
    }
    
    // Migrate user roles
    const { data: roles } = await supabase
      .from('user_roles')
      .select('*');
    
    if (roles) {
      for (const role of roles) {
        try {
          await connection.execute(
            'INSERT INTO user_roles (user_id, role, is_primary) VALUES (?, ?, ?)',
            [role.user_id, role.role, role.is_primary || false]
          );
        } catch (error) {
          if (error.code !== 'ER_DUP_ENTRY') {
            console.error('Error inserting role:', error.message);
          }
        }
      }
      console.log(`✅ Migrated ${roles.length} user roles`);
    }
    
  } catch (error) {
    console.error('❌ Error migrating users:', error.message);
  }
}

async function migrate() {
  console.log('🚀 Starting migration from Supabase to MySQL...\n');
  
  let connection;
  
  try {
    // Connect to MySQL
    console.log('📡 Connecting to MySQL...');
    connection = await mysql.createConnection(mysqlConfig);
    console.log('✅ Connected to MySQL\n');
    
    // Migrate users first (they're referenced by other tables)
    await migrateUsers(connection);
    
    // Migrate other tables
    for (const tableName of TABLES) {
      console.log(`\n--- ${tableName.toUpperCase()} ---`);
      
      const data = await exportFromSupabase(tableName);
      await importToMySQL(connection, tableName, data);
    }
    
    console.log('\n✅ Migration completed successfully!');
    console.log('\n⚠️  IMPORTANT: All users have default passwords. They need to reset their passwords!');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n📡 MySQL connection closed');
    }
  }
}

// Run migration
if (require.main === module) {
  migrate().catch(console.error);
}

module.exports = { migrate };
