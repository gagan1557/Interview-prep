const express = require('express');
const router = express.Router();
const TextInterviewResponse = require('../models/TextInterview');
const auth = require('../middleware/auth');

// Get all text interview responses for a user
router.get('/responses', auth, async (req, res) => {
  try {
    const responses = await TextInterviewResponse.find({ userId: req.user.id })
      .sort({ timestamp: -1 });
    res.json(responses);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get responses for a specific session
router.get('/session/:sessionId', auth, async (req, res) => {
  try {
    const responses = await TextInterviewResponse.find({ 
      userId: req.user.id,
      sessionId: req.params.sessionId
    }).sort({ timestamp: 1 });
    res.json(responses);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Save a new text interview response
router.post('/response', auth, async (req, res) => {
  const { sessionId, question, response } = req.body;

  if (!sessionId || !question || !response) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const newResponse = new TextInterviewResponse({
      userId: req.user.id,
      sessionId,
      question,
      response
    });

    await newResponse.save();
    res.status(201).json(newResponse);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Analyze interview responses
router.post('/analyze', auth, async (req, res) => {
  try {
    const { responses } = req.body;
    
    if (!responses || !Array.isArray(responses) || responses.length === 0) {
      return res.status(400).json({ message: 'Valid responses are required for analysis' });
    }
    
    // Here you would typically call an AI service (e.g., OpenAI/GPT, or other NLP service)
    // For demonstration, we'll create a simulated analysis
    
    const analysis = generateAnalysis(responses);
    
    res.json(analysis);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error generating analysis' });
  }
});

// Helper function to generate analysis (in a real app, replace with AI API)
function generateAnalysis(responses) {
  // Calculate total words
  const totalWords = responses.reduce((count, item) => {
    return count + countWords(item.response);
  }, 0);
  
  const avgWordsPerResponse = Math.round(totalWords / responses.length);
  
  // Extract keywords (in production, use NLP)
  const keywords = extractKeywords(responses);
  
  // Generate feedback based on basic analysis
  const strengths = [];
  const improvements = [];
  
  if (avgWordsPerResponse > 50) {
    strengths.push('Providing detailed and comprehensive answers');
  } else {
    improvements.push('Adding more details to your answers');
  }
  
  if (containsActionVerbs(responses)) {
    strengths.push('Using action-oriented language to describe experiences');
  } else {
    improvements.push('Using more action verbs when describing accomplishments');
  }
  
  if (containsSpecificExamples(responses)) {
    strengths.push('Including specific examples to support your points');
  } else {
    improvements.push('Adding specific examples and metrics to validate your statements');
  }
  
  const score = Math.min(95, 60 + Math.floor(Math.random() * 35));
  
  return {
    metrics: {
      totalResponses: responses.length,
      totalWords,
      avgWordsPerResponse,
      overallScore: score
    },
    strengths,
    improvements,
    keywords,
    tips: [
      "Prepare 2-3 examples for common behavioral questions using the STAR method",
      "Research the company thoroughly before the interview",
      "Practice answering questions out loud to improve delivery",
      "Prepare thoughtful questions to ask the interviewer"
    ]
  };
}

// Helper utility functions
function countWords(text) {
  return text.split(/\s+/).filter(word => word.length > 0).length;
}

function containsActionVerbs(responses) {
  const actionVerbs = ['achieved', 'created', 'developed', 'implemented', 'improved', 'managed', 'led'];
  
  for (const response of responses) {
    const text = response.response.toLowerCase();
    if (actionVerbs.some(verb => text.includes(verb))) {
      return true;
    }
  }
  return false;
}

function containsSpecificExamples(responses) {
  const specificPatterns = [/\d+%/, /increased by/, /reduced/, /improved/, /from .* to/];
  
  for (const response of responses) {
    const text = response.response;
    if (specificPatterns.some(pattern => pattern.test(text))) {
      return true;
    }
  }
  return false;
}

function extractKeywords(responses) {
  const commonWords = new Set(['and', 'the', 'that', 'this', 'with', 'from', 'have', 'for']);
  const allText = responses.map(r => r.response).join(' ').toLowerCase();
  const words = allText.split(/\s+/)
    .filter(word => word.length > 3)
    .filter(word => !commonWords.has(word))
    .map(word => word.replace(/[.,?!;:()]/g, ''));
  
  // Count word frequency
  const wordFreq = {};
  words.forEach(word => {
    wordFreq[word] = (wordFreq[word] || 0) + 1;
  });
  
  // Sort by frequency and get top keywords
  return Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(entry => entry[0]);
}

module.exports = router; 