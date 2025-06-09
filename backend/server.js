const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const questionRoutes = require('./routes/questions');
const resumeRoutes = require('./routes/resume');
const speechRoutes = require('./routes/speech');
const textInterviewRoutes = require('./routes/textInterview');
const videoInterviewRoutes = require('./routes/videoInterview');
const connectDB = require('./config/db');

dotenv.config();

const app = express();

// CORS Configuration - using the cors package
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', 'x-auth-token'],
  credentials: true
}));

// Middleware
app.use(express.json());

// Static files
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/speech', speechRoutes);
app.use('/api/text-interview', textInterviewRoutes);
app.use('/api/video-interview', videoInterviewRoutes);

// Connect to DB before handling any request (for Vercel serverless compatibility)
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Only listen when running locally (not on Vercel)
if (process.env.NODE_ENV !== 'production' || process.env.VERCEL === undefined) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Export the app for Vercel serverless function
module.exports = app; 