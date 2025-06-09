const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Optional for predefined questions
  },
  question: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    required: true,
    enum: ['Easy', 'Medium', 'Hard']
  },
  type: {
    type: String,
    enum: ['Technical', 'Behavioral', 'Situational', 'Skill-based'],
    default: 'Behavioral'
  },
  jobRole: {
    type: String,
    required: false,
    trim: true
  },
  isPersonalized: {
    type: Boolean,
    default: false
  },
  isPredefined: {
    type: Boolean,
    default: true
  },
  source: {
    type: String,
    enum: ['system', 'resume', 'user-created', 'ai-generated'],
    default: 'system'
  },
  relatedSkill: {
    type: String,
    required: false
  },
  relatedExperience: {
    type: String,
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create compound indexes for better query performance
QuestionSchema.index({ jobRole: 1, category: 1, difficulty: 1 });
QuestionSchema.index({ user: 1, isPersonalized: 1 });
QuestionSchema.index({ user: 1, category: 1 });

module.exports = mongoose.model('Question', QuestionSchema); 