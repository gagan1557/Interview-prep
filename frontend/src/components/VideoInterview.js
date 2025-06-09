import React, { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { saveVideoResponse, getVideoQuestions } from '../services/videoInterviewService';
import '../styles/VideoInterview.css';

const VideoInterview = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [recordingStatus, setRecordingStatus] = useState('idle'); // idle, countdown, recording, processing, review
  const [recordingTime, setRecordingTime] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [sessionId, setSessionId] = useState('');
  const [videoUrl, setVideoUrl] = useState(null);
  const [videoBlob, setVideoBlob] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [interviewComplete, setInterviewComplete] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const chunksRef = useRef([]);
  
  // Sample questions for development mode
  const sampleQuestions = [
    { id: 1, text: 'Tell me about yourself and your experience.', category: 'general', maxTime: 60 },
    { id: 2, text: 'Describe a challenging project you worked on and how you handled it.', category: 'behavioral', maxTime: 90 },
    { id: 3, text: 'Why do you want to work for our company?', category: 'company', maxTime: 60 },
    { id: 4, text: 'Where do you see yourself in five years?', category: 'general', maxTime: 60 },
  ];

  // Initialize interview session
  useEffect(() => {
    const initInterview = async () => {
      try {
        setSessionId(uuidv4());
        
        // In development mode, use sample questions
        if (process.env.NODE_ENV === 'development') {
          console.log('Development mode: Using sample questions for video interview');
          setQuestions(sampleQuestions);
          setCurrentQuestion(sampleQuestions[0]);
          setIsLoading(false);
          return;
        }
        
        // Otherwise fetch from API
        const fetchedQuestions = await getVideoQuestions();
        if (fetchedQuestions && fetchedQuestions.length > 0) {
          setQuestions(fetchedQuestions);
          setCurrentQuestion(fetchedQuestions[0]);
        } else {
          // Fallback to sample questions
          setQuestions(sampleQuestions);
          setCurrentQuestion(sampleQuestions[0]);
        }
      } catch (error) {
        console.log('Error initializing video interview, using sample questions:', error.message);
        // Fallback to samples
        setQuestions(sampleQuestions);
        setCurrentQuestion(sampleQuestions[0]);
      } finally {
        setIsLoading(false);
      }
    };
    
    initInterview();
    
    // Clean up any media streams when component unmounts
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Request media permissions and start camera preview
  const setupCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      streamRef.current = stream;
      return true;
    } catch (error) {
      console.error('Error accessing camera:', error);
      setPermissionDenied(true);
      return false;
    }
  };

  // Start recording countdown
  const startCountdown = async () => {
    const cameraReady = await setupCamera();
    if (!cameraReady) return;
    
    setRecordingStatus('countdown');
    setCountdown(3);
    
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          startRecording();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Start actual recording
  const startRecording = () => {
    setRecordingStatus('recording');
    setRecordingTime(0);
    chunksRef.current = [];
    
    // Start recording using MediaRecorder
    if (streamRef.current) {
      const mediaRecorder = new MediaRecorder(streamRef.current, { 
        mimeType: 'video/webm;codecs=vp9,opus' 
      });
      
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setVideoBlob(blob);
        setVideoUrl(URL.createObjectURL(blob));
        setRecordingStatus('review');
      };
      
      // Start recording and timer
      mediaRecorder.start(200);
      
      // Start timer to update recording time
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          // Auto-stop if max time is reached
          if (prev >= (currentQuestion?.maxTime || 60)) {
            stopRecording();
            return currentQuestion?.maxTime || 60;
          }
          return prev + 1;
        });
      }, 1000);
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setRecordingStatus('processing');
      
      // Stop all tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    }
  };

  // Retake current video
  const retakeVideo = async () => {
    // Reset video state
    setVideoUrl(null);
    setVideoBlob(null);
    setRecordingStatus('idle');
    
    // Release any previous URL
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }
  };

  // Save the current video response
  const saveVideo = async () => {
    if (!videoBlob || !currentQuestion) return;
    
    try {
      setRecordingStatus('processing');
      
      // Save the video using the service
      await saveVideoResponse(
        sessionId, 
        currentQuestion.id,
        currentQuestion.text, 
        videoBlob,
        recordingTime
      );
      
      // Move to next question or complete
      moveToNextQuestion();
    } catch (error) {
      console.error('Error saving video:', error);
      // Show error but still allow proceeding
      alert('There was an error saving your video. You may continue to the next question.');
      moveToNextQuestion();
    }
  };

  // Move to next question or finish interview
  const moveToNextQuestion = () => {
    // Reset video state
    setVideoUrl(null);
    setVideoBlob(null);
    setRecordingStatus('idle');
    
    // Release any previous URL
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }
    
    // Check if there are more questions
    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex < questions.length) {
      setCurrentQuestionIndex(nextIndex);
      setCurrentQuestion(questions[nextIndex]);
    } else {
      // Interview complete
      setInterviewComplete(true);
      setFeedback({
        message: 'Your video interview is complete! Your recordings have been saved and are ready for review.',
        reviewUrl: `/video-interview/review/${sessionId}`
      });
    }
  };

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Loading state
  if (isLoading) {
    return <div className="video-interview-loading">Preparing your video interview...</div>;
  }

  // Interview complete state
  if (interviewComplete) {
    return (
      <div className="video-interview-complete">
        <h2>Interview Complete!</h2>
        <p>{feedback?.message}</p>
        <div className="video-interview-actions">
          <a href="/interviews" className="btn btn-secondary">Back to Interviews</a>
          {feedback?.reviewUrl && (
            <a href={feedback.reviewUrl} className="btn btn-primary">Review Your Responses</a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="video-interview-container">
      <div className="video-interview-header">
        <h2>Video Interview Session</h2>
        <div className="interview-progress">
          <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="video-question-card">
        <h3>Question</h3>
        <p>{currentQuestion?.text}</p>
        <div className="question-meta">
          <span>Max time: {formatTime(currentQuestion?.maxTime || 60)}</span>
          <span>Category: {currentQuestion?.category || 'general'}</span>
        </div>
      </div>

      <div className="video-recording-area">
        {permissionDenied ? (
          <div className="permission-error">
            <h3>Camera Access Denied</h3>
            <p>We need camera and microphone permissions to record your interview responses. Please allow access in your browser settings and try again.</p>
            <button 
              className="btn btn-primary" 
              onClick={() => {
                setPermissionDenied(false);
                setupCamera();
              }}
            >
              Try Again
            </button>
          </div>
        ) : (
          <>
            <div className={`video-preview ${recordingStatus === 'recording' ? 'recording' : ''}`}>
              {recordingStatus === 'countdown' && (
                <div className="countdown-overlay">
                  <span>{countdown}</span>
                </div>
              )}
              
              {recordingStatus === 'recording' && (
                <div className="recording-indicator">
                  <span className="recording-dot"></span>
                  <span className="recording-time">{formatTime(recordingTime)}</span>
                </div>
              )}
              
              {(recordingStatus === 'idle' || recordingStatus === 'countdown' || recordingStatus === 'recording') && (
                <video 
                  ref={videoRef} 
                  autoPlay 
                  muted={recordingStatus !== 'recording'} // Only mute during setup
                  playsInline
                />
              )}
              
              {recordingStatus === 'review' && videoUrl && (
                <video 
                  src={videoUrl} 
                  controls 
                  autoPlay
                />
              )}
              
              {recordingStatus === 'processing' && (
                <div className="processing-overlay">
                  <div className="spinner"></div>
                  <p>Processing your response...</p>
                </div>
              )}
            </div>
            
            <div className="recording-controls">
              {recordingStatus === 'idle' && (
                <button 
                  className="btn btn-primary"
                  onClick={startCountdown}
                >
                  Start Recording
                </button>
              )}
              
              {recordingStatus === 'recording' && (
                <button 
                  className="btn btn-danger"
                  onClick={stopRecording}
                >
                  Stop Recording
                </button>
              )}
              
              {recordingStatus === 'review' && (
                <div className="review-actions">
                  <button 
                    className="btn btn-secondary"
                    onClick={retakeVideo}
                  >
                    Retake Video
                  </button>
                  <button 
                    className="btn btn-primary"
                    onClick={saveVideo}
                  >
                    Save & Continue
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
      
      <div className="video-interview-tips">
        <h4>Interview Tips</h4>
        <ul>
          <li>Ensure you are in a well-lit, quiet environment with a clean background</li>
          <li>Speak clearly and maintain eye contact with the camera</li>
          <li>Use the STAR method (Situation, Task, Action, Result) for behavioral questions</li>
          <li>Take a moment to gather your thoughts before answering</li>
          <li>Keep your responses concise but thorough, focusing on relevant experiences</li>
        </ul>
      </div>
    </div>
  );
};

export default VideoInterview; 