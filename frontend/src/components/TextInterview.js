import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { saveResponse, getSessionResponses, getInterviewAnalysis } from '../services/textInterviewService';
import TextInterviewAnalytics from './TextInterviewAnalytics';
import '../styles/TextInterview.css';

const TextInterview = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [userInput, setUserInput] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [allQuestions, setAllQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [interviewComplete, setInterviewComplete] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [isGeneratingAnalytics, setIsGeneratingAnalytics] = useState(false);
  const [allResponses, setAllResponses] = useState([]);
  const chatEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Sample questions as fallback
  const sampleQuestions = [
    { id: 1, text: 'Tell me about yourself.', category: 'general' },
    { id: 2, text: 'What are your strengths?', category: 'general' },
    { id: 3, text: 'What are your weaknesses?', category: 'general' },
    { id: 4, text: 'Why do you want to work for our company?', category: 'company' },
    { id: 5, text: 'Describe a challenging situation you faced and how you handled it.', category: 'behavioral' }
  ];

  // Fetch questions on load
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        // Create a new session ID for this interview
        const newSessionId = uuidv4();
        setSessionId(newSessionId);

        // Skip API call in development mode to avoid 404 errors in console
        if (process.env.NODE_ENV === 'development') {
          console.log('Development mode: Using sample questions');
          setAllQuestions(sampleQuestions);
          setCurrentQuestion(sampleQuestions[0]);
          setChatHistory([{ 
            type: 'question', 
            content: sampleQuestions[0].text,
            timestamp: new Date()
          }]);
          setIsLoading(false);
          return;
        }

        // Only try the API call if we're in production
        try {
          // Add a timeout to prevent long waits
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000);
          
          const response = await fetch('/api/questions', { 
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            // Handle non-200 responses
            throw new Error(`Server returned ${response.status}: ${response.statusText}`);
          }
          
          const contentType = response.headers.get('content-type');
          
          // Only try to parse as JSON if the content type is application/json
          if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            if (data && Array.isArray(data) && data.length > 0) {
              setAllQuestions(data);
              setCurrentQuestion(data[0]);
              
              // Add the first question to chat history
              setChatHistory([{ 
                type: 'question', 
                content: data[0].text,
                timestamp: new Date()
              }]);
              
              setIsLoading(false);
              return;
            }
          }
          // If we get here, the response wasn't valid JSON or was empty
          throw new Error('Invalid or empty response');
        } catch (error) {
          // Instead of showing error in console, just log a message that we're using fallbacks
          if (error.name === 'AbortError') {
            console.log('Questions API request timed out, using sample questions');
          } else if (error.message.includes('404')) {
            console.log('Questions API not available, using sample questions');
          } else {
            console.log('Using sample questions:', error.message);
          }
          
          // Fall through to use sample questions
          setAllQuestions(sampleQuestions);
          setCurrentQuestion(sampleQuestions[0]);
          setChatHistory([{ 
            type: 'question', 
            content: sampleQuestions[0].text,
            timestamp: new Date()
          }]);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Fatal error in fetchQuestions:', error);
        
        // Final fallback - ensure we display something
        setAllQuestions(sampleQuestions);
        setCurrentQuestion(sampleQuestions[0]);
        setChatHistory([{ 
          type: 'question', 
          content: sampleQuestions[0].text,
          timestamp: new Date()
        }]);
        
        setIsLoading(false);
      }
    };
    
    fetchQuestions();
  }, []);

  // Focus the textarea when loaded
  useEffect(() => {
    if (!isLoading && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isLoading]);

  // Scroll to bottom of chat when history changes
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory]);

  const handleInputChange = (e) => {
    setUserInput(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!userInput.trim() || !currentQuestion) return;
    
    // Add user response to chat history
    const newChatHistory = [
      ...chatHistory,
      { 
        type: 'answer', 
        content: userInput,
        timestamp: new Date()
      }
    ];
    
    setChatHistory(newChatHistory);
    
    try {
      // Save the response to the database
      const savedResponse = await saveResponse(
        sessionId,
        currentQuestion.text,
        userInput
      );
      
      // Store all responses for analytics
      setAllResponses([
        ...allResponses, 
        {
          question: currentQuestion.text,
          response: userInput
        }
      ]);
      
      // Clear the input field
      setUserInput('');
      
      // Check if we have more questions
      const nextIndex = currentQuestionIndex + 1;
      
      if (nextIndex < allQuestions.length) {
        // Move to the next question
        setCurrentQuestionIndex(nextIndex);
        setCurrentQuestion(allQuestions[nextIndex]);
        
        // Add the next question to chat history
        setTimeout(() => {
          setChatHistory([
            ...newChatHistory,
            { 
              type: 'question', 
              content: allQuestions[nextIndex].text,
              timestamp: new Date()
            }
          ]);
          
          // Focus the textarea again
          if (textareaRef.current) {
            textareaRef.current.focus();
          }
        }, 1000);
      } else {
        // All questions answered
        setInterviewComplete(true);
        setTimeout(() => {
          const finalChatHistory = [
            ...newChatHistory,
            { 
              type: 'question', 
              content: 'Thank you for completing the interview! Your responses have been saved. Generating your interview analytics...',
              timestamp: new Date()
            }
          ];
          
          setChatHistory(finalChatHistory);
          
          // Generate analytics
          generateAnalytics();
        }, 1000);
      }
    } catch (error) {
      console.error('Error saving response:', error);
      // Show error message
      setChatHistory([
        ...newChatHistory,
        { 
          type: 'error', 
          content: 'There was an error saving your response. Please try again.',
          timestamp: new Date()
        }
      ]);
    }
  };
  
  const generateAnalytics = async () => {
    setIsGeneratingAnalytics(true);
    try {
      // Add a short delay to ensure the UI shows the loading state
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Get analysis using the service (which includes fallback)
      const analysis = await getInterviewAnalysis(allResponses);
      
      // Update state with analysis results
      setAnalytics(analysis);
      setShowAnalytics(true);
    } catch (error) {
      console.error('Fatal error generating analytics:', error);
      setChatHistory(prev => [
        ...prev,
        {
          type: 'error',
          content: 'There was an error generating your interview analytics. Please try again later.',
          timestamp: new Date()
        }
      ]);
    } finally {
      setIsGeneratingAnalytics(false);
    }
  };

  const restartInterview = () => {
    setShowAnalytics(false);
    setInterviewComplete(false);
    setCurrentQuestionIndex(0);
    setCurrentQuestion(allQuestions[0]);
    setAllResponses([]);
    setChatHistory([{ 
      type: 'question', 
      content: allQuestions[0].text,
      timestamp: new Date()
    }]);
    setSessionId(uuidv4()); // Generate new session ID
    setUserInput('');
    
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (isLoading) {
    return <div className="loading">Loading interview questions...</div>;
  }

  if (showAnalytics) {
    return (
      <div className="text-interview-container analytics-view">
        <TextInterviewAnalytics analysis={analytics} />
        <div className="analytics-controls">
          <button 
            className="restart-interview-btn"
            onClick={restartInterview}
          >
            Start New Interview
          </button>
          <a href="/text-interview-results" className="view-results-link">
            View All Interview Results
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="text-interview-container">
      <div className="interview-header">
        <h2>Text-Based Interview</h2>
        <p>Interview Session ID: {sessionId}</p>
        <a href="/text-interview-results" className="view-results-link">View Previous Results</a>
      </div>
      
      <div className="chat-container">
        {chatHistory.map((msg, index) => (
          <div 
            key={index} 
            className={`chat-message ${msg.type === 'question' ? 'interviewer' : msg.type === 'error' ? 'error' : 'user'}`}
          >
            <div className="message-content">{msg.content}</div>
            <div className="message-timestamp">{formatTimestamp(msg.timestamp)}</div>
          </div>
        ))}
        {isGeneratingAnalytics && (
          <div className="generating-analytics">
            <div className="analytics-spinner"></div>
            <p>Analyzing your responses...</p>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>
      
      <form onSubmit={handleSubmit} className="input-container">
        <textarea
          ref={textareaRef}
          value={userInput}
          onChange={handleInputChange}
          placeholder="Type your answer here..."
          disabled={interviewComplete}
          rows={5}
        />
        <button 
          type="submit" 
          disabled={!userInput.trim() || interviewComplete}
        >
          Submit
        </button>
      </form>
      
      <div className="interview-progress">
        <div className="progress-text">
          Question {currentQuestionIndex + 1} of {allQuestions.length}
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${((currentQuestionIndex + 1) / allQuestions.length) * 100}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default TextInterview; 