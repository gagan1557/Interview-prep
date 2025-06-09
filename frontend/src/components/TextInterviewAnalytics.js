import React from 'react';
import '../styles/TextInterviewAnalytics.css';

const TextInterviewAnalytics = ({ analysis }) => {
  if (!analysis) return null;
  
  const { metrics, strengths, improvements, keywords, tips } = analysis;
  
  return (
    <div className="analytics-container">
      <h2>Interview Analysis</h2>
      
      <div className="analytics-score">
        <div className="score-circle">
          <div className="score-value">{metrics.overallScore}</div>
          <div className="score-label">Score</div>
        </div>
        <div className="score-metrics">
          <div className="metric-item">
            <div className="metric-value">{metrics.totalResponses}</div>
            <div className="metric-label">Questions Answered</div>
          </div>
          <div className="metric-item">
            <div className="metric-value">{metrics.totalWords}</div>
            <div className="metric-label">Total Words</div>
          </div>
          <div className="metric-item">
            <div className="metric-value">{metrics.avgWordsPerResponse}</div>
            <div className="metric-label">Avg Words/Answer</div>
          </div>
        </div>
      </div>
      
      <div className="analytics-columns">
        <div className="analytics-column">
          <h3>Strengths</h3>
          <ul className="analytics-list strengths-list">
            {strengths.map((strength, index) => (
              <li key={index}>
                <span className="icon">✓</span>
                {strength}
              </li>
            ))}
          </ul>
        </div>
        
        <div className="analytics-column">
          <h3>Areas for Improvement</h3>
          <ul className="analytics-list improvements-list">
            {improvements.map((improvement, index) => (
              <li key={index}>
                <span className="icon">↗</span>
                {improvement}
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      <div className="analytics-keywords">
        <h3>Key Terms Used</h3>
        <div className="keywords-cloud">
          {keywords.map((keyword, index) => (
            <span 
              key={index} 
              className="keyword-tag"
              style={{ 
                fontSize: `${Math.max(0.8, 1 + (index < 5 ? (5-index)*0.1 : 0))}rem`
              }}
            >
              {keyword}
            </span>
          ))}
        </div>
      </div>
      
      <div className="analytics-tips">
        <h3>Interview Tips</h3>
        <ul className="tips-list">
          {tips.map((tip, index) => (
            <li key={index}>{tip}</li>
          ))}
        </ul>
      </div>
      
      <div className="analytics-actions">
        <button className="action-button primary">Save Analysis</button>
        <button className="action-button secondary">Download PDF</button>
      </div>
    </div>
  );
};

export default TextInterviewAnalytics; 