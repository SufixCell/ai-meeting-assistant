require('dotenv').config();
const express = require('express');
const cors = require('cors');
const meetingRoutes = require('./routes/meetingRoutes');

const http = require('http');
const { Server } = require('socket.io');
const localtunnel = require('localtunnel');

// Initialize Express
const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', meetingRoutes);

// Health Check
app.get('/', (req, res) => {
  res.send('AI Meeting Assistant Backend is running!');
});

// Setup Server and Socket.io
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

global.io = io; // Make io accessible in routes

const PORT = process.env.PORT || 5000;

server.listen(PORT, async () => {
  console.log(`Server listening on port ${PORT}`);
  
  try {
    // Start localtunnel to receive webhooks from MeetingBaaS
    const tunnel = await localtunnel({ port: PORT });
    global.WEBHOOK_URL = tunnel.url;
    console.log(`Localtunnel is running at: ${tunnel.url}`);
    
    tunnel.on('close', () => {
      console.log('Localtunnel closed');
    });
  } catch (e) {
    console.error('Error starting localtunnel:', e);
  }
});
