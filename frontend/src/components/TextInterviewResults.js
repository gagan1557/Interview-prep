import React, { useState, useEffect } from 'react';
import { getUserResponses, getSessionResponses } from '../services/textInterviewService';
import '../styles/TextInterviewResults.css';

const TextInterviewResults = () => {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionResponses, setSessionResponses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all user's interview sessions
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const responses = await getUserResponses();
        
        // Group responses by sessionId
        const sessionsMap = responses.reduce((acc, response) => {
          if (!acc[response.sessionId]) {
            acc[response.sessionId] = {
              sessionId: response.sessionId,
              date: new Date(response.timestamp),
              responseCount: 0
            };
          }
          acc[response.sessionId].responseCount += 1;
          return acc;
        }, {});
        
        // Convert to array and sort by date (newest first)
        const sessionsList = Object.values(sessionsMap).sort((a, b) => b.date - a.date);
        setSessions(sessionsList);
        
        // Select the most recent session by default if available
        if (sessionsList.length > 0) {
          setSelectedSession(sessionsList[0].sessionId);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching sessions:', error);
        setIsLoading(false);
      }
    };
    
    fetchSessions();
  }, []);

  // Fetch responses for the selected session
  useEffect(() => {
    if (!selectedSession) return;
    
    const fetchSessionResponses = async () => {
      try {
        const responses = await getSessionResponses(selectedSession);
        setSessionResponses(responses);
      } catch (error) {
        console.error('Error fetching session responses:', error);
      }
    };
    
    fetchSessionResponses();
  }, [selectedSession]);

  const handleSessionSelect = (sessionId) => {
    setSelectedSession(sessionId);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  if (isLoading) {
    return <div className="loading">Loading interview results...</div>;
  }

  if (sessions.length === 0) {
    return (
      <div className="no-results">
        <h2>No Interview Results</h2>
        <p>You haven't completed any text interviews yet.</p>
        <a href="/text-interview" className="start-interview-button">Start a New Interview</a>
      </div>
    );
  }

  return (
    <div className="interview-results-container">
      <h2>Your Interview Results</h2>
      
      <div className="results-content">
        <div className="sessions-list">
          <h3>Interview Sessions</h3>
          <ul>
            {sessions.map(session => (
              <li 
                key={session.sessionId}
                className={selectedSession === session.sessionId ? 'selected' : ''}
                onClick={() => handleSessionSelect(session.sessionId)}
              >
                <div className="session-date">{formatDate(session.date)}</div>
                <div className="session-info">
                  <span className="response-count">{session.responseCount} responses</span>
                  <span className="session-id">ID: {session.sessionId.substring(0, 8)}...</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="session-responses">
          <h3>Interview Transcript</h3>
          
          {sessionResponses.length > 0 ? (
            <div className="responses-list">
              {sessionResponses.map((response, index) => (
                <div key={response._id || index} className="response-item">
                  <div className="question">
                    <strong>Q:</strong> {response.question}
                  </div>
                  <div className="answer">
                    <strong>A:</strong> {response.response}
                  </div>
                  <div className="timestamp">
                    {formatDate(response.timestamp)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-responses">
              <p>No responses found for this session.</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="action-buttons">
        <a href="/text-interview" className="start-interview-button">Start a New Interview</a>
      </div>
    </div>
  );
};

export default TextInterviewResults; 