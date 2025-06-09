const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  extractedText: {
    type: String,
    required: true
  },
  basics: {
    name: String,
    email: String,
    phone: String,
    location: String,
    summary: String,
    title: String
  },
  skills: [String],
  experience: [{
    company: String,
    position: String,
    startDate: Date,
    endDate: Date,
    current: Boolean,
    description: String,
    highlights: [String],
    keywords: [String]
  }],
  education: [{
    institution: String,
    degree: String,
    field: String,
    startDate: Date,
    endDate: Date,
    gpa: String
  }],
  projects: [{
    name: String,
    description: String,
    keywords: [String],
    url: String
  }],
  certifications: [{
    name: String,
    issuer: String,
    date: Date
  }],
  languages: [String],
  interests: [String],
  parsedSuccessfully: {
    type: Boolean,
    default: false
  },
  uploadDate: {
    type: Date,
    default: Date.now
  }
});

const Resume = mongoose.model('Resume', resumeSchema);

module.exports = Resume; 