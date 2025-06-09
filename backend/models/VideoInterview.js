const mongoose = require('mongoose');

// Schema for a video recording in an interview session
const VideoResponseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  sessionId: {
    type: String,
    required: true
  },
  questionId: {
    type: String,
    required: true
  },
  question: {
    type: String,
    required: true
  },
  videoUrl: {
    type: String,
    required: true
  },
  thumbnailUrl: {
    type: String,
    default: ''
  },
  duration: {
    type: Number,
    default: 0
  },
  filename: {
    type: String,
    required: true
  },
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null
    },
    strengths: [String],
    improvements: [String],
    comments: String
  },
  shares: [
    {
      shareId: {
        type: String,
        required: true
      },
      expiresAt: {
        type: Date,
        default: null
      },
      allowFeedback: {
        type: Boolean,
        default: false
      },
      isPublic: {
        type: Boolean,
        default: false
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }
  ],
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Indexes for faster querying
VideoResponseSchema.index({ userId: 1, sessionId: 1 });
VideoResponseSchema.index({ 'shares.shareId': 1 });

module.exports = mongoose.model('VideoResponse', VideoResponseSchema); 