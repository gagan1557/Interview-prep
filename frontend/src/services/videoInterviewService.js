import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const API_URL = '/api/video-interview';

// Firebase config - to be replaced with actual config in production
const FIREBASE_CONFIG = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Configure axios headers
const configureHeaders = () => {
  return {
    headers: {
      'Content-Type': 'application/json',
      'x-auth-token': getAuthToken()
    }
  };
};

// Initialize Firebase in non-development environments
let storage = null;
let firebaseApp = null;
let storageRef = null;

const initializeFirebase = async () => {
  if (process.env.NODE_ENV !== 'development' && !firebaseApp) {
    try {
      // Dynamic import to prevent loading Firebase in development
      const firebase = await import('firebase/app');
      await import('firebase/storage');
      
      firebaseApp = firebase.initializeApp(FIREBASE_CONFIG);
      storage = firebase.storage();
      return true;
    } catch (error) {
      console.error('Error initializing Firebase:', error);
      return false;
    }
  }
  return process.env.NODE_ENV === 'development' || !!firebaseApp;
};

// Get video interview questions
export const getVideoQuestions = async () => {
  try {
    // Skip API call in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log('Development mode: Using mock video questions');
      return null; // This will cause the component to use sample questions
    }
    
    const res = await axios.get(`${API_URL}/questions`, configureHeaders());
    return res.data;
  } catch (error) {
    console.log('Error fetching video questions:', error.message);
    return null;
  }
};

// Save a video response
export const saveVideoResponse = async (sessionId, questionId, question, videoBlob, duration) => {
  try {
    // In development mode, don't actually upload
    if (process.env.NODE_ENV === 'development') {
      console.log('Development mode: Simulating video upload');
      await new Promise(resolve => setTimeout(resolve, 1500)); // Fake delay
      
      return {
        id: uuidv4(),
        url: URL.createObjectURL(videoBlob), // Local URL for preview only
        sessionId,
        questionId,
        question,
        duration,
        timestamp: new Date()
      };
    }
    
    // Initialize Firebase for storage
    const firebaseInitialized = await initializeFirebase();
    if (!firebaseInitialized) {
      throw new Error('Failed to initialize storage');
    }
    
    // Generate a unique filename for the video
    const filename = `${sessionId}_${questionId}_${Date.now()}.webm`;
    const uploadRef = storage.ref(`interview-videos/${filename}`);
    
    // Upload the video blob
    const uploadTask = uploadRef.put(videoBlob, { contentType: 'video/webm' });
    
    // Monitor the upload progress
    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // Track upload progress if needed
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`Upload progress: ${progress}%`);
        },
        (error) => {
          // Handle upload errors
          console.error('Upload error:', error);
          reject(error);
        },
        async () => {
          try {
            // Upload completed, get the download URL
            const downloadUrl = await uploadTask.snapshot.ref.getDownloadURL();
            
            // Save metadata to API
            const videoData = {
              sessionId,
              questionId,
              question,
              videoUrl: downloadUrl,
              duration,
              filename
            };
            
            const res = await axios.post(
              `${API_URL}/save-recording`,
              videoData,
              configureHeaders()
            );
            
            resolve(res.data);
          } catch (error) {
            console.error('Error getting download URL or saving metadata:', error);
            reject(error);
          }
        }
      );
    });
  } catch (error) {
    console.error('Error saving video response:', error);
    throw error;
  }
};

// Get all video sessions for the current user
export const getVideoSessions = async () => {
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log('Development mode: Returning mock video sessions');
      return generateMockVideoSessions();
    }
    
    const res = await axios.get(`${API_URL}/sessions`, configureHeaders());
    return res.data;
  } catch (error) {
    console.log('Error fetching video sessions, using mock data:', error.message);
    return generateMockVideoSessions();
  }
};

// Get videos for a specific session
export const getSessionVideos = async (sessionId) => {
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log('Development mode: Returning mock session videos');
      return generateMockSessionVideos(sessionId);
    }
    
    const res = await axios.get(
      `${API_URL}/session/${sessionId}`, 
      configureHeaders()
    );
    return res.data;
  } catch (error) {
    console.log('Error fetching session videos, using mock data:', error.message);
    return generateMockSessionVideos(sessionId);
  }
};

// Delete a video recording
export const deleteVideoRecording = async (videoId) => {
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log('Development mode: Simulating video deletion');
      await new Promise(resolve => setTimeout(resolve, 500)); // Fake delay
      return { success: true };
    }
    
    const res = await axios.delete(
      `${API_URL}/recording/${videoId}`,
      configureHeaders()
    );
    return res.data;
  } catch (error) {
    console.error('Error deleting video recording:', error);
    throw error;
  }
};

// Share a video recording (generates a shareable link)
export const shareVideoRecording = async (videoId, shareOptions) => {
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log('Development mode: Simulating share link generation');
      await new Promise(resolve => setTimeout(resolve, 500)); // Fake delay
      
      // Generate a mock shareable link
      const shareId = Math.random().toString(36).substring(2, 10);
      return {
        shareableLink: `${window.location.origin}/shared-video/${shareId}`,
        expiresAt: shareOptions.expiresAt || null
      };
    }
    
    const res = await axios.post(
      `${API_URL}/share/${videoId}`,
      shareOptions,
      configureHeaders()
    );
    return res.data;
  } catch (error) {
    console.error('Error generating share link:', error);
    throw error;
  }
};

// Helper functions to generate mock data for development
const generateMockVideoSessions = () => {
  return [
    {
      sessionId: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
      date: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
      totalVideos: 4,
      title: 'Frontend Developer Interview Practice'
    },
    {
      sessionId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
      date: new Date(Date.now() - 86400000 * 7).toISOString(), // 7 days ago
      totalVideos: 5,
      title: 'Product Manager Mock Interview'
    }
  ];
};

const generateMockSessionVideos = (sessionId) => {
  const videos = [
    {
      id: '5ca48c74-2c7c-4d78-8b17-6c9c5d8daadc',
      question: 'Tell me about yourself and your experience.',
      duration: 45,
      thumbnailUrl: 'https://via.placeholder.com/320x180.png?text=Interview+Video+1',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
      feedback: null
    },
    {
      id: 'b6bdc37c-cf59-4688-b59f-ef6d8233a755',
      question: 'Describe a challenging project you worked on and how you handled it.',
      duration: 68,
      thumbnailUrl: 'https://via.placeholder.com/320x180.png?text=Interview+Video+2',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      timestamp: new Date(Date.now() - 86400000 * 2 + 300000).toISOString(),
      feedback: {
        rating: 4,
        strengths: ['Good explanation of problem-solving approach', 'Clear communication'],
        improvements: ['Could provide more specific metrics', 'Consider using the STAR format more explicitly']
      }
    },
    {
      id: 'deaf1900-1708-47e8-b246-acfb781e7caa',
      question: 'Why do you want to work for our company?',
      duration: 52,
      thumbnailUrl: 'https://via.placeholder.com/320x180.png?text=Interview+Video+3',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      timestamp: new Date(Date.now() - 86400000 * 2 + 600000).toISOString(),
      feedback: {
        rating: 3,
        strengths: ['Good research on company values'],
        improvements: ['Be more specific about how your skills align with company needs']
      }
    },
  ];
  
  // Return all videos for development mode
  return videos;
}; 