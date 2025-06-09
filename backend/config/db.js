const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Use only the environment variable for MongoDB connection
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      console.error('MONGODB_URI environment variable is not set');
      process.exit(1);
    }
    
    // Set strictQuery to false to suppress warnings
    mongoose.set('strictQuery', false);
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    console.error('Could not connect to MongoDB. Please check your connection string.');
    process.exit(1);
  }
};

module.exports = connectDB; 