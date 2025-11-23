const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:8080', 'http://localhost:5173', 'https://hasetcompany.or.tz'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Store connected clients
const connectedClients = new Map();

io.on('connection', (socket) => {
  console.log('✅ Client connected:', socket.id);
  
  // Store client info
  connectedClients.set(socket.id, {
    connectedAt: new Date(),
    userId: socket.handshake.auth.userId
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
    connectedClients.delete(socket.id);
  });

  // Handle custom events
  socket.on('join:room', (room) => {
    socket.join(room);
    console.log(`📍 Client ${socket.id} joined room: ${room}`);
  });
});

// API endpoint to trigger events (called by Laravel backend)
app.post('/api/socket/emit', express.json(), (req, res) => {
  const { event, data, room } = req.body;
  
  if (!event) {
    return res.status(400).json({ error: 'Event name required' });
  }

  console.log(`📡 Emitting event: ${event}`, data);

  if (room) {
    io.to(room).emit(event, data);
  } else {
    io.emit(event, data);
  }

  res.json({ success: true, event, clients: connectedClients.size });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    clients: connectedClients.size,
    uptime: process.uptime()
  });
});

const PORT = process.env.SOCKET_PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Socket.io server running on port ${PORT}`);
  console.log(`📡 Ready to handle real-time updates`);
});
