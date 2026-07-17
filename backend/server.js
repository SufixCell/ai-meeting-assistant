require('dotenv').config();
const express = require('express');
const cors = require('cors');
const meetingRoutes = require('./routes/meetingRoutes');

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

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
