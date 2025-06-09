const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const auth = require('../middleware/auth');
const VideoResponse = require('../models/VideoInterview');

// Import Firebase Admin SDK for server-side operations
let admin = null;
try {
  admin = require('firebase-admin');
  
  // Check if Firebase is already initialized
  if (!admin.apps.length) {
    // Initialize Firebase Admin with service account
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
      : require('../config/firebase-service-account.json');
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET
    });
  }
} catch (error) {
  console.warn("Firebase Admin SDK not initialized:", error.message);
  console.warn("Video interview storage features will not be available.");
}

// Get video interview questions
router.get('/questions', auth, async (req, res) => {
  try {
    // For now, return predefined questions
    const questions = [
      { id: 1, text: 'Tell me about yourself and your experience.', category: 'general', maxTime: 60 },
      { id: 2, text: 'Describe a challenging project you worked on and how you handled it.', category: 'behavioral', maxTime: 90 },
      { id: 3, text: 'Why do you want to work for our company?', category: 'company', maxTime: 60 },
      { id: 4, text: 'What are your strengths and weaknesses?', category: 'general', maxTime: 90 },
      { id: 5, text: 'Where do you see yourself in five years?', category: 'general', maxTime: 60 }
    ];
    
    res.json(questions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Save a video recording
router.post('/save-recording', auth, async (req, res) => {
  try {
    const { sessionId, questionId, question, videoUrl, duration, filename } = req.body;
    
    if (!sessionId || !questionId || !question || !videoUrl || !filename) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Get thumbnail URL (optional)
    const thumbnailUrl = `https://via.placeholder.com/320x180.png?text=Video+${questionId}`;
    
    // Save to database
    const videoResponse = new VideoResponse({
      userId: req.user.id,
      sessionId,
      questionId,
      question,
      videoUrl,
      thumbnailUrl,
      duration: duration || 0,
      filename
    });
    
    await videoResponse.save();
    
    res.status(201).json(videoResponse);
  } catch (err) {
    console.error('Error saving video recording:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all user's video sessions (grouped by sessionId)
router.get('/sessions', auth, async (req, res) => {
  try {
    // Aggregate to group by sessionId
    const sessions = await VideoResponse.aggregate([
      { $match: { userId: req.user.id } },
      { 
        $group: {
          _id: '$sessionId',
          sessionId: { $first: '$sessionId' },
          date: { $first: '$timestamp' },
          totalVideos: { $sum: 1 }
        }
      },
      { $sort: { date: -1 } }
    ]);
    
    // Add session title (first question from each session)
    for (let session of sessions) {
      const firstVideo = await VideoResponse.findOne(
        { userId: req.user.id, sessionId: session.sessionId },
        'question'
      ).sort({ timestamp: 1 });
      
      if (firstVideo) {
        session.title = `Interview: ${firstVideo.question.substring(0, 30)}...`;
      } else {
        session.title = 'Untitled Interview';
      }
    }
    
    res.json(sessions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get videos for a specific session
router.get('/session/:sessionId', auth, async (req, res) => {
  try {
    const videos = await VideoResponse.find({
      userId: req.user.id,
      sessionId: req.params.sessionId
    }).sort({ timestamp: 1 });
    
    res.json(videos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a video recording
router.delete('/recording/:videoId', auth, async (req, res) => {
  try {
    const video = await VideoResponse.findById(req.params.videoId);
    
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }
    
    // Make sure user owns the video
    if (video.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    // Delete from storage if Firebase is initialized
    if (admin) {
      try {
        // Extract the path from the video URL
        const bucket = admin.storage().bucket();
        const filePath = `interview-videos/${video.filename}`;
        
        // Delete file from Firebase Storage
        await bucket.file(filePath).delete();
      } catch (storageError) {
        console.error('Error deleting from storage:', storageError);
        // Continue with deletion even if storage deletion fails
      }
    }
    
    // Delete from database
    await VideoResponse.findByIdAndDelete(req.params.videoId);
    
    res.json({ message: 'Video deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a shareable link for a video
router.post('/share/:videoId', auth, async (req, res) => {
  try {
    const { expiresAt, allowFeedback, isPublic } = req.body;
    const video = await VideoResponse.findById(req.params.videoId);
    
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }
    
    // Make sure user owns the video
    if (video.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    // Generate a unique share ID
    const shareId = uuidv4();
    
    // Add the share information to the video
    const shareInfo = {
      shareId,
      expiresAt: expiresAt || null,
      allowFeedback: allowFeedback || false,
      isPublic: isPublic || false,
      createdAt: new Date()
    };
    
    video.shares.push(shareInfo);
    await video.save();
    
    // Create the full shareable URL
    const shareableLink = `${process.env.FRONT_END_URL || 'http://localhost:3000'}/shared-video/${shareId}`;
    
    res.json({ 
      shareId,
      shareableLink,
      expiresAt: shareInfo.expiresAt
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a shared video by share ID (public endpoint, no auth required)
router.get('/shared/:shareId', async (req, res) => {
  try {
    const video = await VideoResponse.findOne({
      'shares.shareId': req.params.shareId
    });
    
    if (!video) {
      return res.status(404).json({ message: 'Shared video not found' });
    }
    
    // Find the specific share info
    const shareInfo = video.shares.find(share => share.shareId === req.params.shareId);
    
    // Check if share link has expired
    if (shareInfo.expiresAt && new Date() > new Date(shareInfo.expiresAt)) {
      return res.status(410).json({ message: 'This share link has expired' });
    }
    
    // Check if authentication is required
    if (!shareInfo.isPublic) {
      // Verify the user is authenticated (would need auth middleware)
      // This is simplified - real implementation would need proper auth check
      if (!req.header('x-auth-token')) {
        return res.status(401).json({ message: 'Authentication required to view this video' });
      }
    }
    
    // Return only necessary info
    const videoData = {
      videoId: video._id,
      question: video.question,
      videoUrl: video.videoUrl,
      thumbnailUrl: video.thumbnailUrl,
      duration: video.duration,
      timestamp: video.timestamp,
      allowFeedback: shareInfo.allowFeedback,
      feedback: video.feedback
    };
    
    res.json(videoData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add feedback to a shared video
router.post('/feedback/:videoId', async (req, res) => {
  try {
    const { shareId, rating, strengths, improvements, comments } = req.body;
    
    if (!shareId || !rating) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    const video = await VideoResponse.findById(req.params.videoId);
    
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }
    
    // Find the specific share info
    const shareInfo = video.shares.find(share => share.shareId === shareId);
    
    if (!shareInfo) {
      return res.status(404).json({ message: 'Share not found' });
    }
    
    // Check if feedback is allowed for this share
    if (!shareInfo.allowFeedback) {
      return res.status(403).json({ message: 'Feedback is not allowed for this video' });
    }
    
    // Check if share link has expired
    if (shareInfo.expiresAt && new Date() > new Date(shareInfo.expiresAt)) {
      return res.status(410).json({ message: 'This share link has expired' });
    }
    
    // Update feedback
    video.feedback = {
      rating: rating,
      strengths: strengths || [],
      improvements: improvements || [],
      comments: comments || ''
    };
    
    await video.save();
    
    res.json({ message: 'Feedback saved successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 