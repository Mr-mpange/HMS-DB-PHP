const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');
const { Server } = require('socket.io');
const cron = require('node-cron');
const db = require('./config/database');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// CORS configuration - allow multiple origins
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:8081',
  'http://localhost:3000',
  'http://localhost:5174',
  process.env.FRONTEND_URL
].filter(Boolean);

// Socket.io setup for real-time features
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting - more permissive for development
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000, // Increased from 100 to 1000
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Make io accessible to routes
app.set('io', io);

// Middleware
const { authenticate } = require('./middleware/auth');

// Routes
const authRoutes = require('./routes/auth');
const patientRoutes = require('./routes/patients');
const appointmentRoutes = require('./routes/appointments');
const prescriptionRoutes = require('./routes/prescriptions');
const labRoutes = require('./routes/labs');
const pharmacyRoutes = require('./routes/pharmacy');
const billingRoutes = require('./routes/billing');
const visitRoutes = require('./routes/visits');
const userRoutes = require('./routes/users');
const uploadRoutes = require('./routes/upload');
const activityRoutes = require('./routes/activity');
const departmentRoutes = require('./routes/departments');
const paymentRoutes = require('./routes/payments');
const settingsRoutes = require('./routes/settings');
const insuranceRoutes = require('./routes/insurance');
const servicesRoutes = require('./routes/services');

app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/labs', labRoutes);
app.use('/api/lab-tests', labRoutes); // Alias for backward compatibility
app.use('/api/pharmacy', pharmacyRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/visits', visitRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/insurance', insuranceRoutes);
app.use('/api/services', servicesRoutes);

// Department fees endpoint
const departmentController = require('./controllers/departmentController');
app.get('/api/department-fees', authenticate, departmentController.getAllDepartmentFees);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({ 
    error: err.message || 'Internal server error' 
  });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Join room for specific updates
  socket.on('subscribe', (room) => {
    socket.join(room);
    console.log(`Socket ${socket.id} joined room: ${room}`);
  });
  
  socket.on('unsubscribe', (room) => {
    socket.leave(room);
    console.log(`Socket ${socket.id} left room: ${room}`);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Helper function to emit real-time updates
global.emitUpdate = (room, event, data) => {
  io.to(room).emit(event, data);
};

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🏥 Hospital Management System API                  ║
║                                                       ║
║   Server running on port ${PORT}                        ║
║   Environment: ${process.env.NODE_ENV || 'development'}                      ║
║   Database: ${process.env.DB_NAME || 'hospital_db'}                       ║
║                                                       ║
║   API: http://localhost:${PORT}/api                     ║
║   Health: http://localhost:${PORT}/api/health           ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = { app, io };


// Scheduled Tasks
// Update patient status every hour (mark as Inactive if no visit in 24 hours)
cron.schedule('0 * * * *', async () => {
  console.log('Running scheduled task: Update patient status...');
  try {
    // Mark patients as Inactive if no visit in last 24 hours
    const [result] = await db.execute(`
      UPDATE patients p
      LEFT JOIN (
        SELECT patient_id, MAX(created_at) as last_visit
        FROM patient_visits
        GROUP BY patient_id
      ) v ON p.id = v.patient_id
      SET p.status = 'Inactive'
      WHERE p.status = 'Active'
        AND (v.last_visit IS NULL OR v.last_visit < DATE_SUB(NOW(), INTERVAL 24 HOUR))
    `);
    
    // Mark patients as Active if they have a visit in last 24 hours
    const [result2] = await db.execute(`
      UPDATE patients p
      INNER JOIN (
        SELECT patient_id, MAX(created_at) as last_visit
        FROM patient_visits
        GROUP BY patient_id
      ) v ON p.id = v.patient_id
      SET p.status = 'Active'
      WHERE v.last_visit >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
    `);
    
    console.log(`✓ Patient status updated: ${result.affectedRows} marked Inactive, ${result2.affectedRows} marked Active`);
  } catch (error) {
    console.error('Error updating patient status:', error);
  }
});

console.log('✓ Scheduled tasks initialized (Patient status updates every hour)');
