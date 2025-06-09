import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const ResumeUpload = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    
    if (selectedFile) {
      const fileExt = selectedFile.name.split('.').pop().toLowerCase();
      if (['pdf', 'doc', 'docx'].includes(fileExt)) {
        setFile(selectedFile);
        setError('');
      } else {
        setFile(null);
        setError('Please select a PDF, DOC, or DOCX file');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    setLoading(true);
    
    const formData = new FormData();
    formData.append('resume', file);
    
    try {
      const token = localStorage.getItem('token');
      
      await axios.post('http://localhost:5000/api/resume/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });
      
      setLoading(false);
      navigate('/resume');
    } catch (err) {
      setLoading(false);
      console.error('Detailed resume upload error:', err);
      
      // Extract the most useful error information
      let errorMessage = 'Error uploading resume';
      
      if (err.response) {
        // The server responded with a status code outside the 2xx range
        console.log('Error response data:', err.response.data);
        console.log('Error response status:', err.response.status);
        
        if (err.response.data && err.response.data.message) {
          errorMessage = err.response.data.message;
        } else if (err.response.status === 500) {
          errorMessage = 'Server error: The file may be too large or in an unsupported format';
        } else if (err.response.status === 401) {
          errorMessage = 'Authentication error: Please log in again';
        }
      } else if (err.request) {
        // The request was made but no response was received
        errorMessage = 'No response from server. Please check your connection.';
      }
      
      setError(errorMessage);
    }
  };

  return (
    <div className="resume-upload-container">
      <h2>Upload Your Resume</h2>
      <p>Upload your resume to help us personalize your interview questions</p>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="file-input-container">
          <input 
            type="file" 
            id="resume-file" 
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx"
          />
          <label htmlFor="resume-file">
            {file ? file.name : 'Choose a file'}
          </label>
        </div>
        
        {file && (
          <div className="file-info">
            <p>Selected file: {file.name}</p>
            <p>Size: {(file.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
        )}
        
        <button 
          type="submit" 
          className="upload-button"
          disabled={loading || !file}
        >
          {loading ? 'Uploading...' : 'Upload Resume'}
        </button>
      </form>
    </div>
  );
};

export default ResumeUpload; 