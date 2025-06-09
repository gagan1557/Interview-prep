import React, { useState, useEffect } from 'react';
import { getJobRoles, getQuestionsByJobRole } from '../services/questionService';
import '../styles/InterviewQuestions.css';

const InterviewQuestions = () => {
  const [jobRoles, setJobRoles] = useState([]);
  const [selectedJobRole, setSelectedJobRole] = useState('');
  const [questions, setQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState({});
  const [expandedQuestion, setExpandedQuestion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [answerFeedback, setAnswerFeedback] = useState({});
  const [answerEvaluations, setAnswerEvaluations] = useState({});
  const [evaluating, setEvaluating] = useState({});
  const [filters, setFilters] = useState({
    category: '',
    difficulty: '',
    limit: 5
  });

  // Fetch job roles when component mounts
  useEffect(() => {
    const fetchJobRoles = async () => {
      try {
        const roles = await getJobRoles();
        setJobRoles(roles);
        // Select first role if available
        if (roles && roles.length > 0) {
          setSelectedJobRole(roles[0]);
        }
      } catch (error) {
        setError('Failed to load job roles. Please try again later.');
      }
    };

    fetchJobRoles();
  }, []);

  // Fetch questions when selectedJobRole changes
  useEffect(() => {
    if (selectedJobRole) {
      fetchQuestions();
    }
  }, [selectedJobRole, filters]);

  const fetchQuestions = async () => {
    setLoading(true);
    setError('');
    try {
      const fetchedQuestions = await getQuestionsByJobRole(selectedJobRole, filters);
      setQuestions(fetchedQuestions);
      // Reset answers when new questions are loaded
      setUserAnswers({});
      setAnswerFeedback({});
      setAnswerEvaluations({});
      setExpandedQuestion(null);
    } catch (error) {
      setError('Failed to load questions. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleJobRoleChange = (e) => {
    setSelectedJobRole(e.target.value);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prevFilters => ({
      ...prevFilters,
      [name]: value
    }));
  };

  const handleRegenerate = () => {
    // Add a random seed parameter to force new questions
    setFilters(prevFilters => ({
      ...prevFilters,
      seed: Date.now() // Add a timestamp to ensure we get different questions
    }));
    
    // Fetch questions with the updated filters
    fetchQuestions();
  };

  const toggleQuestion = (questionId) => {
    setExpandedQuestion(expandedQuestion === questionId ? null : questionId);
  };

  const handleAnswerChange = (questionId, answer) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
    
    // Clear evaluation when answer changes
    if (answerEvaluations[questionId]) {
      setAnswerEvaluations(prev => {
        const newEvaluations = { ...prev };
        delete newEvaluations[questionId];
        return newEvaluations;
      });
    }
  };

  const handleSaveAnswer = (questionId) => {
    // Here you could save the answer to a database if needed
    // For now, we'll just provide feedback
    setAnswerFeedback(prev => ({
      ...prev,
      [questionId]: {
        message: 'Answer saved successfully!',
        type: 'success'
      }
    }));

    // Clear feedback after 3 seconds
    setTimeout(() => {
      setAnswerFeedback(prev => {
        const newFeedback = { ...prev };
        delete newFeedback[questionId];
        return newFeedback;
      });
    }, 3000);
  };

  const handleEvaluateAnswer = async (questionId, questionText, userAnswer) => {
    const question = questions.find(q => (q._id || '') === questionId || questions.indexOf(q) === parseInt(questionId.replace('q-', '')));
    
    if (!question) return;
    
    // Set evaluating state for this question
    setEvaluating(prev => ({ ...prev, [questionId]: true }));
    
    try {
      // Simulate AI evaluation (in a real app, you would call an API)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate evaluation based on question difficulty and category
      const score = Math.floor(Math.random() * 31) + 70; // Random score between 70-100
      const category = question.category || 'technical';
      const difficulty = question.difficulty || 'intermediate';
      
      // Generate model answer
      let modelAnswer = '';
      if (category === 'technical') {
        if (question.text.includes('stack') && question.text.includes('queue')) {
          modelAnswer = `A stack is a Last-In-First-Out (LIFO) data structure where elements are added and removed from the same end. Think of it like a stack of plates - you can only take from the top.

A queue is a First-In-First-Out (FIFO) data structure where elements are added at one end and removed from the other end. Think of it like a line of people waiting - the first person to join is the first person to leave.

Real-world examples:
- Stack: Browser history, undo function in text editors, call stack in programming
- Queue: Print job processing, task scheduling, breadth-first search algorithm`;
        } else {
          modelAnswer = `This question requires a technical explanation with clear definitions, examples, and practical applications.

Key points to cover:
1. Start with a clear definition of the technical concept
2. Explain the underlying principles or mechanisms
3. Provide code examples if applicable
4. Discuss trade-offs and best practices
5. Mention real-world applications

The answer should demonstrate both theoretical knowledge and practical experience with the subject matter.`;
        }
      } else if (category === 'behavioral') {
        modelAnswer = `When answering this behavioral question, it's important to use the STAR method:

Situation: Describe the specific challenge or situation you faced.
Task: Explain your responsibility in that situation.
Action: Detail the steps you took to address it.
Result: Share the outcomes and what you learned.

For example: "In my previous role, we faced a critical deadline for a client project (S). As the lead developer, I needed to ensure we delivered high-quality code on time (T). I reorganized our priorities, implemented pair programming sessions, and worked with the team to establish a more efficient workflow (A). As a result, we delivered the project two days early with zero critical bugs, and the client was so impressed they increased their contract with us (R)."`;
      } else {
        modelAnswer = `For situational questions, demonstrate your problem-solving approach and decision-making process:

1. Analyze the situation carefully, identifying key stakeholders and constraints
2. Consider multiple approaches and their potential outcomes
3. Decide on a course of action that balances various factors
4. Explain how you would implement the solution and measure its success

Remember to emphasize communication, collaboration, and ethical considerations in your response.`;
      }
      
      // Areas for improvement
      const improvements = [];
      if (userAnswer.length < 100) {
        improvements.push("Provide more detail and examples");
      }
      if (!userAnswer.includes("example")) {
        improvements.push("Include specific examples to illustrate your points");
      }
      if (category === 'behavioral' && !userAnswer.toLowerCase().includes("situation") && !userAnswer.toLowerCase().includes("task")) {
        improvements.push("Use the STAR method (Situation, Task, Action, Result) to structure your answer");
      }
      if (difficulty === 'advanced' && userAnswer.split('.').length < 5) {
        improvements.push("Demonstrate deeper technical knowledge and more comprehensive analysis");
      }
      
      // Store the evaluation
      setAnswerEvaluations(prev => ({
        ...prev,
        [questionId]: {
          score,
          modelAnswer,
          improvements
        }
      }));
    } catch (error) {
      console.error('Error evaluating answer:', error);
    } finally {
      // Clear evaluating state
      setEvaluating(prev => {
        const newEvaluating = { ...prev };
        delete newEvaluating[questionId];
        return newEvaluating;
      });
    }
  };

  // Simple function to generate an answer suggestion
  const generateAnswerSuggestion = (question) => {
    // This is a simplified approach - in a real app, you might call an AI service
    const type = question.category || 'technical';
    const difficulty = question.difficulty || 'intermediate';
    
    let suggestion = "Here's a suggested approach to answering this question:\n\n";
    
    if (type === 'technical') {
      suggestion += "• Start by explaining the core concepts\n";
      suggestion += "• Provide a specific example or use case\n";
      suggestion += "• If applicable, briefly mention potential alternatives\n";
      suggestion += "• Conclude with best practices or optimization tips";
    } else if (type === 'behavioral') {
      suggestion += "• Use the STAR method: Situation, Task, Action, Result\n";
      suggestion += "• Describe a specific situation from your experience\n";
      suggestion += "• Explain what your role was and what actions you took\n";
      suggestion += "• Share the outcomes and what you learned";
    } else {
      suggestion += "• Carefully analyze the hypothetical situation\n";
      suggestion += "• Explain your thought process and considerations\n";
      suggestion += "• Describe the approach you would take step by step\n";
      suggestion += "• Highlight how your approach aligns with professional best practices";
    }
    
    return suggestion;
  };

  return (
    <div className="interview-questions-container">
      <h2>Interview Questions Practice</h2>
      
      <div className="filters-container">
        <div className="filter-group">
          <label htmlFor="jobRole">Job Role</label>
          <select 
            id="jobRole" 
            value={selectedJobRole} 
            onChange={handleJobRoleChange}
            className="select-input"
          >
            {jobRoles.map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <label htmlFor="category">Question Type</label>
          <select 
            id="category" 
            name="category" 
            value={filters.category} 
            onChange={handleFilterChange}
            className="select-input"
          >
            <option value="">All Types</option>
            <option value="technical">Technical</option>
            <option value="behavioral">Behavioral</option>
            <option value="situational">Situational</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label htmlFor="difficulty">Difficulty</label>
          <select 
            id="difficulty" 
            name="difficulty" 
            value={filters.difficulty} 
            onChange={handleFilterChange}
            className="select-input"
          >
            <option value="">All Levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label htmlFor="limit">Number of Questions</label>
          <select 
            id="limit" 
            name="limit" 
            value={filters.limit} 
            onChange={handleFilterChange}
            className="select-input"
          >
            <option value="3">3</option>
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="15">15</option>
          </select>
        </div>
      </div>
      
      <button 
        className="regenerate-button"
        onClick={handleRegenerate}
        disabled={loading}
      >
        {loading ? 'Generating Questions...' : 'Generate New Questions'}
      </button>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="questions-list">
        {loading ? (
          <div className="loading-spinner">Loading interview questions</div>
        ) : (
          questions.map((question, index) => {
            const questionId = question._id || `q-${index}`;
            const isExpanded = expandedQuestion === questionId;
            const hasAnswer = Boolean(userAnswers[questionId]?.trim());
            const hasEvaluation = Boolean(answerEvaluations[questionId]);
            const isEvaluating = Boolean(evaluating[questionId]);
            
            return (
              <div key={questionId} className={`question-card ${isExpanded ? 'expanded' : ''}`}>
                <div className="question-header" onClick={() => toggleQuestion(questionId)}>
                  <div className="question-number">Question {index + 1}</div>
                  <div className="expand-icon">▼</div>
                </div>
                
                <div className="question-text">{question.text}</div>
                
                <div className="question-meta">
                  {question.category && (
                    <span className={`question-tag ${question.category}`}>
                      {question.category}
                    </span>
                  )}
                  {question.difficulty && (
                    <span className={`question-tag ${question.difficulty}`}>
                      {question.difficulty}
                    </span>
                  )}
                  {question.isPredefined === false && (
                    <span className="question-tag ai-generated">AI Generated</span>
                  )}
                </div>
                
                {isExpanded && (
                  <div className="answer-section">
                    <div className="answer-guidance">
                      <h4>Suggested Approach</h4>
                      <pre>{generateAnswerSuggestion(question)}</pre>
                    </div>
                    
                    <h4>Your Answer</h4>
                    <textarea 
                      value={userAnswers[questionId] || ''}
                      onChange={(e) => handleAnswerChange(questionId, e.target.value)}
                      placeholder="Type your interview answer here..."
                      rows="6"
                      className="answer-textarea"
                    />
                    
                    <div className="answer-actions">
                      <button 
                        className="save-answer-button"
                        onClick={() => handleSaveAnswer(questionId)}
                        disabled={!hasAnswer}
                      >
                        Save Answer
                      </button>
                      
                      <button
                        className="evaluate-button"
                        onClick={() => handleEvaluateAnswer(questionId, question.text, userAnswers[questionId] || '')}
                        disabled={!hasAnswer || isEvaluating}
                      >
                        {isEvaluating ? 'Evaluating...' : 'Evaluate Answer'}
                      </button>
                    </div>
                    
                    {answerFeedback[questionId] && (
                      <div className={`answer-feedback ${answerFeedback[questionId].type}`}>
                        {answerFeedback[questionId].message}
                      </div>
                    )}
                    
                    {hasEvaluation && (
                      <div className="evaluation-container">
                        <div className="evaluation-header">
                          <h4>AI Evaluation</h4>
                          <div className="score-display">
                            <span className="score-value">{answerEvaluations[questionId].score}</span>
                            <span className="score-max">/100</span>
                          </div>
                        </div>
                        
                        {answerEvaluations[questionId].improvements.length > 0 && (
                          <div className="improvements-section">
                            <h5>Areas for Improvement</h5>
                            <ul className="improvements-list">
                              {answerEvaluations[questionId].improvements.map((improvement, i) => (
                                <li key={i}>{improvement}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        <div className="model-answer-section">
                          <h5>Model Answer</h5>
                          <div className="model-answer">
                            {answerEvaluations[questionId].modelAnswer}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
        
        {!loading && questions.length === 0 && (
          <div className="no-questions">
            No questions available. Try changing your filters or generating new questions.
          </div>
        )}
      </div>
    </div>
  );
};

export default InterviewQuestions; 