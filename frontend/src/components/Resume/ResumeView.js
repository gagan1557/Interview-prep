import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './ResumeStyles.css';

const ResumeView = () => {
  const [resume, setResume] = useState(null);
  const [personalizedQuestions, setPersonalizedQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retries, setRetries] = useState(0);

  useEffect(() => {
    const fetchResumeData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        if (!token) {
          setError('Authentication error: Please log in to view your resume');
          setLoading(false);
          return;
        }
        
        // Fetch resume data with a timeout to handle hanging requests
        const resumeResponse = await axios.get('http://localhost:5000/api/resume', {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          timeout: 10000 // 10 second timeout
        });
        
        if (resumeResponse.data) {
          setResume(resumeResponse.data);
          
          // Fetch personalized questions based on resume
          try {
            const questionsResponse = await axios.get('http://localhost:5000/api/resume/questions', {
              headers: {
                'Authorization': `Bearer ${token}`
              },
              timeout: 8000
            });
            
            setPersonalizedQuestions(questionsResponse.data);
          } catch (questionsErr) {
            console.error('Error fetching personalized questions:', questionsErr);
            // Don't fail the whole component if just questions fail to load
            setPersonalizedQuestions([]);
          }
        } else {
          setResume(null);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching resume data:', err);
        
        // Handle different error cases
        if (err.response) {
          // Server responded with an error status
          if (err.response.status === 404) {
            // Resume not found - this is a normal case for new users
            setResume(null);
            setError('');
          } else if (err.response.status === 401 || err.response.status === 403) {
            setError('Authentication error: Please log in again to view your resume');
          } else {
            setError(`Could not load resume data: ${err.response.data?.message || 'Server error'}`);
          }
        } else if (err.request) {
          // Request was made but no response received (network error)
          if (retries < 2) {
            // Retry up to 2 times with a delay
            setRetries(prev => prev + 1);
            setTimeout(() => fetchResumeData(), 2000);
            return;
          }
          setError('Network error: Unable to connect to the server. Please check your internet connection and try again.');
        } else {
          // Something else happened while setting up the request
          setError('Could not load resume data: ' + (err.message || 'Unknown error'));
        }
        
        setLoading(false);
      }
    };

    fetchResumeData();
  }, [retries]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading resume information...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">
          <h3>Error Loading Resume</h3>
          <p>{error}</p>
          <div className="error-actions">
            <button onClick={() => setRetries(prev => prev + 1)} className="retry-button">
              Try Again
            </button>
            <Link to="/resume/upload" className="upload-link">
              Upload New Resume
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!resume) {
    return (
      <div className="no-resume">
        <h2>Resume Not Found</h2>
        <p>You haven't uploaded a resume yet. Upload your resume to get personalized interview questions.</p>
        <Link to="/resume/upload" className="upload-link">
          Upload Resume
        </Link>
      </div>
    );
  }

  return (
    <div className="resume-view-container">
      <div className="resume-header">
        <h2>{resume.basics?.name ? resume.basics.name : 'Your Resume'}</h2>
        {resume.basics?.title && <h3 className="resume-title">{resume.basics.title}</h3>}
      </div>
      
      <div className="resume-meta">
        <p><strong>Filename:</strong> {resume.fileName}</p>
        <p><strong>Uploaded:</strong> {new Date(resume.uploadDate).toLocaleDateString()}</p>
      </div>
      
      {resume.basics && (
        <div className="resume-section">
          <h3>Contact Information</h3>
          <div className="contact-info">
            {resume.basics.email && (
              <div className="contact-item">
                <span className="contact-label">Email:</span>
                <span className="contact-value">{resume.basics.email}</span>
              </div>
            )}
            {resume.basics.phone && (
              <div className="contact-item">
                <span className="contact-label">Phone:</span>
                <span className="contact-value">{resume.basics.phone}</span>
              </div>
            )}
            {resume.basics.location && (
              <div className="contact-item">
                <span className="contact-label">Location:</span>
                <span className="contact-value">{resume.basics.location}</span>
              </div>
            )}
          </div>
          
          {resume.basics.summary && (
            <div className="summary-section">
              <h4>Summary</h4>
              <p>{resume.basics.summary}</p>
            </div>
          )}
        </div>
      )}
      
      {resume.skills && resume.skills.length > 0 && (
        <div className="resume-section">
          <h3>Skills</h3>
          <div className="skills-list">
            {resume.skills.map((skill, index) => (
              <span key={index} className="skill-tag">
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {resume.experience && resume.experience.length > 0 && (
        <div className="resume-section">
          <h3>Experience</h3>
          <div className="experience-list">
            {resume.experience.map((exp, index) => (
              <div key={index} className="experience-item">
                <div className="experience-header">
                  <h4>{exp.position || 'Position'}</h4>
                  <h5>{exp.company || 'Company'}</h5>
                </div>
                <p className="experience-description">{exp.description || 'No description provided'}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {resume.education && resume.education.length > 0 && (
        <div className="resume-section">
          <h3>Education</h3>
          <div className="education-list">
            {resume.education.map((edu, index) => (
              <div key={index} className="education-item">
                <h4>{edu.institution || 'Institution'}</h4>
                <h5>{edu.degree} {edu.field ? `in ${edu.field}` : ''}</h5>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {personalizedQuestions.length > 0 && (
        <div className="resume-section personalized-questions">
          <h3>Personalized Interview Questions</h3>
          <p className="section-description">Based on your resume, we've generated these questions to help you prepare:</p>
          <ul className="questions-list">
            {personalizedQuestions.map((q, index) => (
              <li key={index} className="question-item">
                <span className="question-category">{q.category}</span>
                <p className="question-text">{q.question}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="resume-actions">
        <Link to="/resume/upload" className="upload-new-button">
          Upload New Resume
        </Link>
        <Link to="/questions" className="practice-button">
          Practice Questions
        </Link>
      </div>
    </div>
  );
};

export default ResumeView; 