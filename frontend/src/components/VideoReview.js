import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getSessionVideos, shareVideoRecording, deleteVideoRecording } from '../services/videoInterviewService';
import '../styles/VideoReview.css';

const VideoReview = () => {
  const { sessionId } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [shareOptions, setShareOptions] = useState({
    expiryDays: 7,
    allowFeedback: true,
    isPublic: false
  });
  const [shareLinkGenerated, setShareLinkGenerated] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  
  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setIsLoading(true);
        const fetchedVideos = await getSessionVideos(sessionId);
        if (fetchedVideos && fetchedVideos.length > 0) {
          setVideos(fetchedVideos);
          setSelectedVideo(fetchedVideos[0]);
        }
      } catch (error) {
        console.error('Error fetching videos:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (sessionId) {
      fetchVideos();
    }
  }, [sessionId]);
  
  const handleVideoSelect = (video) => {
    setSelectedVideo(video);
    setShareLinkGenerated(false);
    setShareLink('');
    setDeleteConfirm(false);
  };
  
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const handleShareChange = (e) => {
    const { name, value, type, checked } = e.target;
    setShareOptions(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const generateShareLink = async () => {
    try {
      if (!selectedVideo) return;
      
      const options = {
        expiresAt: shareOptions.expiryDays > 0 
          ? new Date(Date.now() + (shareOptions.expiryDays * 86400000)).toISOString()
          : null,
        allowFeedback: shareOptions.allowFeedback,
        isPublic: shareOptions.isPublic
      };
      
      const result = await shareVideoRecording(selectedVideo.id, options);
      
      if (result && result.shareableLink) {
        setShareLink(result.shareableLink);
        setShareLinkGenerated(true);
      }
    } catch (error) {
      console.error('Error generating share link:', error);
      alert('Failed to generate share link. Please try again later.');
    }
  };
  
  const copyShareLink = () => {
    navigator.clipboard.writeText(shareLink)
      .then(() => {
        alert('Link copied to clipboard!');
      })
      .catch(err => {
        console.error('Failed to copy link:', err);
      });
  };
  
  const confirmDelete = async () => {
    try {
      if (!selectedVideo) return;
      
      await deleteVideoRecording(selectedVideo.id);
      
      // Remove the deleted video from the list
      setVideos(prev => prev.filter(v => v.id !== selectedVideo.id));
      
      // Select the next video if available
      if (videos.length > 1) {
        const currentIndex = videos.findIndex(v => v.id === selectedVideo.id);
        const nextIndex = currentIndex === videos.length - 1 ? 0 : currentIndex + 1;
        setSelectedVideo(videos[nextIndex]);
      } else {
        setSelectedVideo(null);
      }
      
      setDeleteConfirm(false);
    } catch (error) {
      console.error('Error deleting video:', error);
      alert('Failed to delete video. Please try again later.');
    }
  };
  
  if (isLoading) {
    return <div className="video-review-loading">Loading your interview recordings...</div>;
  }
  
  if (!selectedVideo) {
    return (
      <div className="video-review-container empty-state">
        <h2>No Videos Found</h2>
        <p>There are no recorded videos for this interview session.</p>
        <a href="/video-interview" className="btn btn-primary">Start New Interview</a>
      </div>
    );
  }
  
  return (
    <div className="video-review-container">
      <div className="video-review-header">
        <h2>Video Interview Review</h2>
        <div className="session-info">
          <span>Session ID: {sessionId}</span>
          <span>Total Videos: {videos.length}</span>
        </div>
      </div>
      
      <div className="video-review-content">
        <div className="video-sidebar">
          <h3>Interview Questions</h3>
          <div className="video-list">
            {videos.map(video => (
              <div 
                key={video.id}
                className={`video-list-item ${selectedVideo?.id === video.id ? 'active' : ''}`}
                onClick={() => handleVideoSelect(video)}
              >
                <div className="video-thumbnail">
                  <img src={video.thumbnailUrl || `https://via.placeholder.com/120x68.png?text=Video`} alt="Thumbnail" />
                  <span className="duration">{formatDuration(video.duration)}</span>
                </div>
                <div className="video-info">
                  <p className="video-question">{video.question}</p>
                  <span className="video-date">
                    {new Date(video.timestamp).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="video-main-content">
          <div className="video-player-container">
            <h3>{selectedVideo.question}</h3>
            <video 
              src={selectedVideo.videoUrl} 
              controls 
              className="main-video-player"
            ></video>
            
            <div className="video-actions">
              {!deleteConfirm ? (
                <>
                  <button 
                    className="btn btn-danger"
                    onClick={() => setDeleteConfirm(true)}
                  >
                    Delete Video
                  </button>
                  
                  <button 
                    className="btn btn-primary"
                    onClick={generateShareLink}
                    disabled={shareLinkGenerated}
                  >
                    Generate Share Link
                  </button>
                </>
              ) : (
                <div className="delete-confirmation">
                  <p>Are you sure you want to delete this video?</p>
                  <div className="confirm-actions">
                    <button 
                      className="btn btn-secondary"
                      onClick={() => setDeleteConfirm(false)}
                    >
                      Cancel
                    </button>
                    <button 
                      className="btn btn-danger"
                      onClick={confirmDelete}
                    >
                      Yes, Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {shareLinkGenerated && (
              <div className="share-link-container">
                <h4>Share Link Generated</h4>
                <div className="share-link-box">
                  <input 
                    type="text" 
                    value={shareLink} 
                    readOnly 
                  />
                  <button 
                    className="btn btn-primary"
                    onClick={copyShareLink}
                  >
                    Copy
                  </button>
                </div>
              </div>
            )}
            
            {!shareLinkGenerated && (
              <div className="share-options">
                <h4>Share Options</h4>
                <div className="option-group">
                  <label>
                    Link expires after:
                    <select 
                      name="expiryDays" 
                      value={shareOptions.expiryDays}
                      onChange={handleShareChange}
                    >
                      <option value="1">1 day</option>
                      <option value="7">7 days</option>
                      <option value="30">30 days</option>
                      <option value="0">Never</option>
                    </select>
                  </label>
                </div>
                
                <div className="option-group checkbox">
                  <label>
                    <input 
                      type="checkbox" 
                      name="allowFeedback" 
                      checked={shareOptions.allowFeedback}
                      onChange={handleShareChange}
                    />
                    Allow feedback from viewers
                  </label>
                </div>
                
                <div className="option-group checkbox">
                  <label>
                    <input 
                      type="checkbox" 
                      name="isPublic" 
                      checked={shareOptions.isPublic}
                      onChange={handleShareChange}
                    />
                    Make publicly accessible (no login required)
                  </label>
                </div>
              </div>
            )}
          </div>
          
          {selectedVideo.feedback && (
            <div className="video-feedback">
              <h3>Feedback</h3>
              <div className="rating">
                <span>Rating: </span>
                {[1, 2, 3, 4, 5].map(star => (
                  <span 
                    key={star}
                    className={`star ${star <= selectedVideo.feedback.rating ? 'filled' : ''}`}
                  >
                    ★
                  </span>
                ))}
              </div>
              
              <div className="feedback-sections">
                <div className="feedback-section">
                  <h4>Strengths</h4>
                  <ul>
                    {selectedVideo.feedback.strengths.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="feedback-section">
                  <h4>Areas for Improvement</h4>
                  <ul>
                    {selectedVideo.feedback.improvements.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="video-review-footer">
        <a href="/video-interview" className="btn btn-primary">Record New Video</a>
        <a href="/dashboard" className="btn btn-secondary">Back to Dashboard</a>
      </div>
    </div>
  );
};

export default VideoReview; 