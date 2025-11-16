# MySQL Migration Guide - From Supabase to MySQL

## 🔄 Migration Overview

This guide will help you migrate your Hospital Management System from Supabase (PostgreSQL) to MySQL.

## ⚠️ Important Considerations

### What You'll Lose:
- ❌ **Supabase Auth** - Need to implement custom authentication
- ❌ **Row Level Security (RLS)** - Need to implement in application layer
- ❌ **Real-time Subscriptions** - Need alternative (WebSockets, Polling, Pusher, etc.)
- ❌ **Supabase Client SDK** - Need to use MySQL client
- ❌ **Auto-generated REST API** - Need to build custom API

### What You'll Gain:
- ✅ **Full Control** - Complete control over database
- ✅ **Self-Hosted Option** - Can host anywhere
- ✅ **MySQL Ecosystem** - Access to MySQL tools and features
- ✅ **Cost Control** - Potentially lower costs for large scale
- ✅ **Flexibility** - More deployment options

## 📋 Migration Strategy

### Option 1: Full Rewrite (Recommended for Production)
- Build new backend API (Node.js/Express, Python/FastAPI, etc.)
- Implement authentication system
- Migrate database schema
- Update frontend to use new API
- Implement real-time features if needed

### Option 2: Gradual Migration
- Keep Supabase for auth initially
- Move data to MySQL
- Build API layer
- Migrate features one by one
- Finally migrate auth

### Option 3: Hybrid Approach
- Use Supabase for auth only
- Use MySQL for data storage
- Build API for data operations

## 🗄️ Database Schema Migration

### Step 1: Export Supabase Schema

```sql
-- Get your current schema from Supabase
-- Go to Supabase Dashboard → SQL Editor
-- Run this to see your tables:

SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Export each table structure
```

### Step 2: Convert PostgreSQL to MySQL

Key differences to handle:

| PostgreSQL | MySQL |
|------------|-------|
| `UUID` | `CHAR(36)` or `BINARY(16)` |
| `TIMESTAMPTZ` | `TIMESTAMP` |
| `JSONB` | `JSON` |
| `SERIAL` | `AUTO_INCREMENT` |
| `BOOLEAN` | `TINYINT(1)` or `BOOLEAN` |
| `TEXT` | `TEXT` or `VARCHAR` |

### Step 3: Create MySQL Schema

```sql
-- Example: patients table conversion

-- PostgreSQL (Supabase)
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name TEXT NOT NULL,
    date_of_birth DATE,
    phone VARCHAR(20),
    email VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- MySQL Equivalent
CREATE TABLE patients (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    full_name VARCHAR(255) NOT NULL,
    date_of_birth DATE,
    phone VARCHAR(20),
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## 🔧 Backend API Implementation

### Recommended Stack:

#### Option A: Node.js + Express
```bash
npm install express mysql2 bcrypt jsonwebtoken cors dotenv
```

#### Option B: Python + FastAPI
```bash
pip install fastapi uvicorn mysql-connector-python python-jose passlib
```

#### Option C: PHP + Laravel
```bash
composer create-project laravel/laravel hospital-api
```

### Sample Backend Structure (Node.js):

```
backend/
├── src/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── patientController.js
│   │   ├── appointmentController.js
│   │   └── billingController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── roleCheck.js
│   ├── models/
│   │   ├── Patient.js
│   │   ├── Appointment.js
│   │   └── Invoice.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── patients.js
│   │   └── appointments.js
│   └── server.js
├── .env
└── package.json
```

## 🔐 Authentication Implementation

### 1. Database Tables for Auth

```sql
-- Users table
CREATE TABLE users (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email)
) ENGINE=InnoDB;

-- User roles table
CREATE TABLE user_roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    role ENUM('admin', 'doctor', 'nurse', 'lab_tech', 'pharmacist', 'billing', 'receptionist') NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB;

-- Sessions table (optional, for session management)
CREATE TABLE sessions (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36) NOT NULL,
    token VARCHAR(500) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB;
```

### 2. Authentication API (Node.js Example)

```javascript
// src/controllers/authController.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

exports.register = async (req, res) => {
  try {
    const { email, password, full_name, role } = req.body;
    
    // Hash password
    const password_hash = await bcrypt.hash(password, 10);
    
    // Insert user
    const [result] = await db.execute(
      'INSERT INTO users (email, password_hash, full_name) VALUES (?, ?, ?)',
      [email, password_hash, full_name]
    );
    
    const userId = result.insertId;
    
    // Assign role
    await db.execute(
      'INSERT INTO user_roles (user_id, role, is_primary) VALUES (?, ?, TRUE)',
      [userId, role]
    );
    
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Get user
    const [users] = await db.execute(
      'SELECT * FROM users WHERE email = ? AND is_active = TRUE',
      [email]
    );
    
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = users[0];
    
    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Get user roles
    const [roles] = await db.execute(
      'SELECT role, is_primary FROM user_roles WHERE user_id = ?',
      [user.id]
    );
    
    // Generate JWT
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        roles: roles.map(r => r.role)
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        roles: roles
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

### 3. Authentication Middleware

```javascript
// src/middleware/auth.js
const jwt = require('jsonwebtoken');

exports.authenticate = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

exports.requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const hasRole = roles.some(role => req.user.roles.includes(role));
    if (!hasRole) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
};
```

## 🔄 Real-time Features Replacement

### Option 1: WebSockets (Socket.io)

```javascript
// server.js
const io = require('socket.io')(server, {
  cors: { origin: process.env.FRONTEND_URL }
});

io.on('connection', (socket) => {
  console.log('Client connected');
  
  socket.on('subscribe', (room) => {
    socket.join(room);
  });
});

// Emit updates when data changes
function notifyUpdate(room, data) {
  io.to(room).emit('update', data);
}
```

### Option 2: Server-Sent Events (SSE)

```javascript
app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  // Send updates
  const interval = setInterval(() => {
    res.write(`data: ${JSON.stringify({ message: 'update' })}\n\n`);
  }, 5000);
  
  req.on('close', () => {
    clearInterval(interval);
  });
});
```

### Option 3: Polling (Simplest)

```typescript
// Frontend
useEffect(() => {
  const interval = setInterval(() => {
    fetchData();
  }, 5000); // Poll every 5 seconds
  
  return () => clearInterval(interval);
}, []);
```

### Option 4: Third-party Service (Pusher, Ably)

```javascript
// Using Pusher
const Pusher = require('pusher');

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER
});

// Trigger event
pusher.trigger('appointments', 'new-appointment', {
  appointment: appointmentData
});
```

## 🔌 Frontend Integration

### 1. Create API Client

```typescript
// src/lib/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### 2. Replace Supabase Calls

```typescript
// Before (Supabase)
const { data, error } = await supabase
  .from('patients')
  .select('*')
  .eq('id', patientId);

// After (MySQL API)
const { data } = await api.get(`/patients/${patientId}`);
```

### 3. Update Auth Context

```typescript
// src/contexts/AuthContext.tsx
import api from '@/lib/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  
  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('auth_token', data.token);
    setUser(data.user);
  };
  
  const logout = () => {
    localStorage.removeItem('auth_token');
    setUser(null);
  };
  
  // ... rest of context
};
```

## 📊 Data Migration

### Export from Supabase

```javascript
// export-data.js
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function exportTable(tableName) {
  const { data, error } = await supabase
    .from(tableName)
    .select('*');
  
  if (error) throw error;
  
  fs.writeFileSync(
    `./exports/${tableName}.json`,
    JSON.stringify(data, null, 2)
  );
}

// Export all tables
const tables = ['patients', 'appointments', 'prescriptions', /* ... */];
tables.forEach(exportTable);
```

### Import to MySQL

```javascript
// import-data.js
const mysql = require('mysql2/promise');
const fs = require('fs');

async function importTable(tableName) {
  const data = JSON.parse(
    fs.readFileSync(`./exports/${tableName}.json`, 'utf8')
  );
  
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'hospital_db'
  });
  
  for (const row of data) {
    const columns = Object.keys(row).join(', ');
    const placeholders = Object.keys(row).map(() => '?').join(', ');
    const values = Object.values(row);
    
    await connection.execute(
      `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders})`,
      values
    );
  }
  
  await connection.end();
}
```

## 🚀 Deployment Options

### Option 1: Self-Hosted MySQL
- Install MySQL on your server
- Configure firewall and security
- Set up backups
- Monitor performance

### Option 2: Managed MySQL Services
- **AWS RDS** - Fully managed, auto-backups
- **Google Cloud SQL** - Integrated with GCP
- **Azure Database** - Microsoft's managed service
- **DigitalOcean** - Simple and affordable
- **PlanetScale** - Serverless MySQL

### Option 3: Hybrid
- Use managed MySQL for database
- Deploy API on Vercel/Netlify/Railway
- Keep frontend deployment same

## 💰 Cost Comparison

| Service | Supabase | MySQL (Self-Hosted) | MySQL (Managed) |
|---------|----------|---------------------|-----------------|
| Small | $25/mo | $5-10/mo | $15-30/mo |
| Medium | $99/mo | $20-40/mo | $50-100/mo |
| Large | $599/mo | $100-200/mo | $200-500/mo |

## ⏱️ Migration Timeline

### Phase 1: Planning (1-2 weeks)
- Design new architecture
- Choose tech stack
- Plan data migration
- Set up development environment

### Phase 2: Backend Development (3-4 weeks)
- Set up MySQL database
- Build API endpoints
- Implement authentication
- Add authorization
- Test thoroughly

### Phase 3: Frontend Migration (2-3 weeks)
- Create API client
- Replace Supabase calls
- Update auth flow
- Implement real-time alternative
- Test all features

### Phase 4: Data Migration (1 week)
- Export data from Supabase
- Transform data format
- Import to MySQL
- Verify data integrity
- Test with real data

### Phase 5: Testing & Deployment (1-2 weeks)
- End-to-end testing
- Performance testing
- Security audit
- Deploy to production
- Monitor closely

**Total: 8-12 weeks**

## ⚠️ Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Data loss | High | Multiple backups, test migration |
| Downtime | High | Plan maintenance window, parallel run |
| Auth issues | High | Thorough testing, rollback plan |
| Performance | Medium | Load testing, optimization |
| Real-time lag | Medium | Choose appropriate solution |
| Cost overrun | Low | Monitor costs, optimize queries |

## 🎯 Recommendation

### For Your Hospital System:

**I recommend staying with Supabase** because:

1. ✅ **Built-in Auth** - Saves weeks of development
2. ✅ **Real-time** - Critical for your workflow
3. ✅ **RLS** - Security built-in
4. ✅ **Fast Development** - Focus on features, not infrastructure
5. ✅ **Scalable** - Handles growth automatically
6. ✅ **Cost-Effective** - For small to medium scale

**Consider MySQL only if:**
- You need specific MySQL features
- You have existing MySQL infrastructure
- You have backend development resources
- You need complete control
- Cost is a major concern at scale

## 📞 Need Help?

If you still want to proceed with MySQL migration, I can help you:
1. Design the backend API architecture
2. Create database schema
3. Build authentication system
4. Implement API endpoints
5. Update frontend integration

Let me know if you want to proceed!

---

**Complexity**: High  
**Time Required**: 8-12 weeks  
**Recommended**: Stay with Supabase  
**Last Updated**: November 15, 2025
