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

// MongoDB Connection
// Try connecting to MongoDB Atlas first, fallback to local MongoDB
const connectDB = async () => {
  try {
    // Set strictQuery to suppress deprecation warning
    mongoose.set('strictQuery', false);
    
    // Try MongoDB Atlas first (if MONGODB_URI is provided)
    if (process.env.MONGODB_URI) {
      await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      console.log('Connected to MongoDB Atlas');
    } else {
      // Fallback to local MongoDB
      await mongoose.connect('mongodb://localhost:27017/interview-preparation', {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      console.log('Connected to local MongoDB');
    }
  } catch (err) {
    console.error('MongoDB connection error:', err);
    console.log('Attempting to connect to local MongoDB...');
    
    try {
      // Last resort: Try a more permissive local connection
      await mongoose.connect('mongodb://127.0.0.1:27017/interview-preparation', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000 // Reduce timeout for faster feedback
      });
      console.log('Connected to local MongoDB (127.0.0.1)');
    } catch (localErr) {
      console.error('Failed to connect to local MongoDB:', localErr);
      console.log('Please make sure MongoDB is installed and running locally, or update MongoDB Atlas settings.');
    }
  }
};

connectDB();

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Only listen if not in a serverless environment
if (process.env.NODE_ENV !== 'production' || process.env.VERCEL === undefined) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Export the app for Vercel
module.exports = app; 