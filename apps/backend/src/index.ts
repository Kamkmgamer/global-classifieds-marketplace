import 'dotenv/config'; // Load environment variables first
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? 'YOUR_FRONTEND_PROD_URL' : '*', // Adjust for production
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(express.json()); // Parse JSON request bodies
app.use(cors()); // Enable CORS for all origins in development
app.use(helmet()); // Add security headers

// Basic health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ message: 'Backend is healthy! 💪' });
});

// Socket.IO connection handling (basic example)
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });

  socket.on('message', (msg) => {
    console.log('Message received:', msg);
    io.emit('message', msg); // Broadcast message to all connected clients
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
  console.log(`Access health check at http://localhost:${PORT}/api/health`);
});