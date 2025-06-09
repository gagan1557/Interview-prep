import React, { useState } from 'react';
import '../styles/Feedback.css';

const Feedback = () => {
  const [feedbackHistory, setFeedbackHistory] = useState([
    {
      id: 1,
      date: '2024-02-18',
      question: "Tell me about a challenging technical problem you've solved.",
      analysis: {
        clarity: 85,
        confidence: 78,
        structure: 90,
        technicalDepth: 82,
      },
      suggestions: [
        'Consider using more specific technical terms',
        'Add more details about the problem-solving process',
        'Include metrics or results to quantify your success',
      ],
    },
    // Add more feedback history items as needed
  ]);

  const getScoreColor = (score) => {
    if (score >= 90) return '#2ecc71';
    if (score >= 75) return '#3498db';
    if (score >= 60) return '#f1c40f';
    return '#e74c3c';
  };

  return (
    <div className="feedback-container">
      <h2>Interview Feedback History</h2>
      
      {feedbackHistory.map((feedback) => (
        <div key={feedback.id} className="feedback-card">
          <div className="feedback-header">
            <h3>{feedback.question}</h3>
            <span className="feedback-date">{feedback.date}</span>
          </div>

          <div className="analysis-section">
            <h4>Performance Analysis</h4>
            <div className="metrics-grid">
              {Object.entries(feedback.analysis).map(([metric, score]) => (
                <div key={metric} className="metric-item">
                  <div className="metric-label">
                    {metric.charAt(0).toUpperCase() + metric.slice(1)}
                  </div>
                  <div 
                    className="metric-score"
                    style={{ color: getScoreColor(score) }}
                  >
                    {score}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="suggestions-section">
            <h4>Suggestions for Improvement</h4>
            <ul>
              {feedback.suggestions.map((suggestion, index) => (
                <li key={index}>{suggestion}</li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Feedback; 