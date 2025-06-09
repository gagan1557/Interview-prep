import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import '../styles/SpeechToText.css';

const SpeechToText = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sampleResponses, setSampleResponses] = useState([]);
  const recognitionRef = useRef(null);
  const audioChunksRef = useRef([]);
  const mediaRecorderRef = useRef(null);
  
  // Sample interview responses
  useEffect(() => {
    setSampleResponses([
      "Tell me about yourself and your experience.",
      "What are your greatest strengths and weaknesses?",
      "Why do you want to work for this company?",
      "Describe a challenging situation at work and how you handled it.",
      "Where do you see yourself in five years?"
    ]);
  }, []);
  
  // Initialize Web Speech API
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Speech recognition is not supported in your browser. Please try Chrome.');
      return;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-US';
    
    recognitionRef.current.onresult = (event) => {
      const currentTranscript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join('');
      setTranscript(currentTranscript);
    };
    
    recognitionRef.current.onerror = (event) => {
      setError(`Speech recognition error: ${event.error}`);
      setIsRecording(false);
    };
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);
  
  // Start recording
  const startRecording = async () => {
    setError('');
    setTranscript('');
    setAnalysis(null);
    setIsLoading(false);
    
    try {
      // Start speech recognition
      recognitionRef.current.start();
      
      // Also record the audio for analysis
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      setError(`Failed to start recording: ${err.message}`);
    }
  };
  
  // Stop recording
  const stopRecording = () => {
    setIsLoading(true);
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await analyzeRecording(audioBlob);
        
        // Clean up
        const tracks = mediaRecorderRef.current.stream.getTracks();
        tracks.forEach(track => track.stop());
        
        setIsLoading(false);
      };
    }
    
    setIsRecording(false);
  };
  
  // Analyze the recording
  const analyzeRecording = async (audioBlob) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob);
      formData.append('transcript', transcript);
      
      const response = await axios.post('http://localhost:5000/api/speech/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setAnalysis(response.data);
    } catch (err) {
      setError(`Analysis error: ${err.message}`);
      setIsLoading(false);
    }
  };
  
  // Use a sample response to practice with
  const handleSampleResponse = async (sample) => {
    setTranscript(sample);
    
    try {
      const response = await axios.post('http://localhost:5000/api/speech/analyze', 
        { transcript: sample },
        { headers: { 'Content-Type': 'application/json' } }
      );
      
      setAnalysis(response.data);
    } catch (err) {
      setError(`Analysis error: ${err.message}`);
    }
  };
  
  return (
    <div className="speech-to-text-container">
      <h2>Speech Analysis</h2>
      <p className="instructions">
        Practice your interview responses and get feedback on your speaking skills.
      </p>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="sample-responses">
        <h3>Sample Interview Questions</h3>
        <p className="sample-instructions">Click a question to analyze a sample response or record your own answer.</p>
        <div className="sample-list">
          {sampleResponses.map((sample, index) => (
            <button 
              key={index} 
              className="sample-button"
              onClick={() => handleSampleResponse(sample)}
              disabled={isRecording || isLoading}
            >
              {sample}
            </button>
          ))}
        </div>
      </div>
      
      <div className="controls">
        {!isRecording ? (
          <button 
            className="record-button"
            onClick={startRecording}
            disabled={(!!error && error.includes('not supported')) || isLoading}
          >
            {isLoading ? 'Analyzing...' : 'Start Recording'}
          </button>
        ) : (
          <button 
            className="stop-button"
            onClick={stopRecording}
          >
            Stop Recording
          </button>
        )}
      </div>
      
      {isRecording && (
        <div className="recording-indicator">
          Recording in progress...
        </div>
      )}
      
      {isLoading && (
        <div className="loading-indicator">
          Analyzing your response...
        </div>
      )}
      
      {transcript && (
        <div className="transcript-container">
          <h3>Your Response:</h3>
          <p className="transcript">{transcript}</p>
        </div>
      )}
      
      {analysis && (
        <div className="analysis-container">
          <h3>Analysis:</h3>
          
          <div className="score-summary">
            <div className="overall-score">
              <h4>Overall Score</h4>
              <div className="overall-score-value">
                {Math.round((analysis.fluencyScore + analysis.clarityScore + analysis.confidenceScore) / 3)}%
              </div>
            </div>
          </div>
          
          <div className="score-card">
            <div className="score-item">
              <span className="score-label">Fluency:</span>
              <div className="score-bar">
                <div 
                  className="score-fill" 
                  style={{ width: `${analysis.fluencyScore}%` }}
                ></div>
              </div>
              <span className="score-value">{analysis.fluencyScore}%</span>
            </div>
            
            <div className="score-item">
              <span className="score-label">Clarity:</span>
              <div className="score-bar">
                <div 
                  className="score-fill" 
                  style={{ width: `${analysis.clarityScore}%` }}
                ></div>
              </div>
              <span className="score-value">{analysis.clarityScore}%</span>
            </div>
            
            <div className="score-item">
              <span className="score-label">Confidence:</span>
              <div className="score-bar">
                <div 
                  className="score-fill" 
                  style={{ width: `${analysis.confidenceScore}%` }}
                ></div>
              </div>
              <span className="score-value">{analysis.confidenceScore}%</span>
            </div>
          </div>
          
          {analysis.details && (
            <div className="speech-metrics">
              <h4>Speech Metrics:</h4>
              <div className="metrics-grid">
                <div className="metric-item">
                  <span className="metric-label">Word Count:</span>
                  <span className="metric-value">{analysis.details.wordCount}</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Sentence Count:</span>
                  <span className="metric-value">{analysis.details.sentenceCount}</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Words per Minute:</span>
                  <span className="metric-value">{analysis.details.speechRate}</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Filler Words:</span>
                  <span className="metric-value">{analysis.details.fillerWords}</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Avg. Words per Sentence:</span>
                  <span className="metric-value">{analysis.details.avgWordsPerSentence}</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Vocabulary Diversity:</span>
                  <span className="metric-value">{analysis.details.vocabularyDiversity}</span>
                </div>
              </div>
            </div>
          )}
          
          {analysis.feedback && (
            <div className="feedback">
              <h4>Feedback:</h4>
              <p>{analysis.feedback}</p>
            </div>
          )}
          
          <div className="improvement-tips">
            <h4>Improvement Tips:</h4>
            <ul>
              <li>Maintain eye contact and confident posture when speaking in actual interviews.</li>
              <li>Record and watch yourself to identify non-verbal communication patterns.</li>
              <li>Practice answering in a structured way: situation, task, action, result (STAR method).</li>
              <li>Work on eliminating filler words by pausing briefly instead.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpeechToText; 