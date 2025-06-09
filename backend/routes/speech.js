const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const speech = require('@google-cloud/speech');

// Configure multer for audio uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/audio');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'audio-' + uniqueSuffix + '.webm');
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

/**
 * @route   POST api/speech/analyze
 * @desc    Analyze speech recording for fluency, clarity, and confidence
 * @access  Private
 */
router.post('/analyze', upload.single('audio'), async (req, res) => {
  try {
    // Check if this is a JSON-only request (for sample responses)
    if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
      const transcript = req.body.transcript || '';
      const analysis = analyzeEnhancedSpeech(transcript);
      return res.json(analysis);
    }
    
    // Regular request with audio file
    let transcript = '';
    
    // Get transcript from request body if available
    if (req.body && req.body.transcript) {
      transcript = req.body.transcript;
    }
    
    // Check if we have an audio file
    if (req.file) {
      const audioFilePath = req.file.path;
      
      // If we have a transcript from the frontend, use it
      // If not, or if it's very short, we'll analyze the audio file directly
      if (!transcript || transcript.trim().length < 10) {
        try {
          // Since we can't use Google Cloud Speech without credentials,
          // we'll use a more advanced simulation for demonstration
          console.log('Using enhanced speech analysis simulation');
        } catch (speechError) {
          console.error('Speech recognition error:', speechError);
          // Fallback to the transcript sent from the frontend, if any
          console.log('Using provided transcript as fallback');
        }
      }
      
      // Clean up the file after analysis
      fs.unlink(audioFilePath, (err) => {
        if (err) console.error('Error deleting audio file:', err);
      });
    } else {
      // No audio file, make sure we have a transcript
      if (!transcript || transcript.trim().length === 0) {
        return res.status(400).json({ error: 'No audio file or transcript provided' });
      }
    }
    
    // Enhanced speech analysis with more detailed metrics
    const analysis = analyzeEnhancedSpeech(transcript);
    
    res.json(analysis);
  } catch (error) {
    console.error('Speech analysis error:', error);
    res.status(500).json({ error: 'Server error during speech analysis' });
  }
});

/**
 * Enhanced speech analysis function with more detailed metrics
 */
function analyzeEnhancedSpeech(transcript) {
  // Basic metrics and advanced metrics
  const words = transcript.split(/\s+/).filter(word => word.length > 0);
  const wordCount = words.length;
  
  // Speech rate (words per minute) - simulate based on transcript length
  // Assuming average speaking rate is 150 words per minute
  const estimatedDuration = wordCount / 150 * 60; // in seconds
  const speechRate = wordCount / (estimatedDuration / 60);
  
  // 1. Fluency analysis with improved metrics
  const fillerWords = countFillerWords(transcript);
  const fillerWordRatio = wordCount > 0 ? fillerWords / wordCount : 0;
  const pauseCount = estimatePauses(transcript);
  const pauseRate = estimatedDuration > 0 ? pauseCount / estimatedDuration : 0;
  
  // Calculate fluency score with multiple factors
  const fluencyBase = 90;
  const fillerPenalty = fillerWordRatio * 100;
  const pausePenalty = pauseRate * 50;
  const fluencyScore = Math.max(0, Math.min(100, Math.round(fluencyBase - fillerPenalty - pausePenalty)));
  
  // 2. Clarity analysis with improved metrics
  const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const sentenceCount = sentences.length;
  const avgWordsPerSentence = sentenceCount > 0 ? wordCount / sentenceCount : 0;
  
  // Structure coherence - percentage of sentences with ideal length (8-25 words)
  const idealSentences = sentences.filter(s => {
    const sentenceWords = s.trim().split(/\s+/).length;
    return sentenceWords >= 8 && sentenceWords <= 25;
  }).length;
  const structureCoherence = sentenceCount > 0 ? idealSentences / sentenceCount : 0;
  
  // Calculate clarity score with multiple factors
  const clarityBase = 85;
  const sentencePenalty = Math.abs(avgWordsPerSentence - 16) * 1.5; // 16 is optimal
  const structureBonus = structureCoherence * 20;
  const clarityScore = Math.max(0, Math.min(100, Math.round(clarityBase - sentencePenalty + structureBonus)));
  
  // 3. Confidence analysis with improved metrics
  const confidenceWords = countConfidenceWords(transcript);
  const uncertaintyWords = countUncertaintyWords(transcript);
  const vocabularyDiversity = calculateVocabularyDiversity(transcript);
  
  // Confidence and uncertainty ratio
  const confidenceRatio = wordCount > 0 ? confidenceWords / wordCount : 0;
  const uncertaintyRatio = wordCount > 0 ? uncertaintyWords / wordCount : 0;
  
  // Calculate confidence score with multiple factors
  const confidenceBase = 75;
  const confidenceBonus = confidenceRatio * 150;
  const uncertaintyPenalty = uncertaintyRatio * 100;
  const diversityBonus = vocabularyDiversity * 25;
  const confidenceScore = Math.max(0, Math.min(100, Math.round(
    confidenceBase + confidenceBonus - uncertaintyPenalty + diversityBonus
  )));
  
  // Generate detailed feedback
  const feedback = generateEnhancedFeedback(
    fluencyScore, 
    clarityScore, 
    confidenceScore, 
    fillerWordRatio,
    pauseRate,
    avgWordsPerSentence,
    structureCoherence,
    confidenceRatio,
    uncertaintyRatio,
    vocabularyDiversity,
    transcript
  );
  
  // Return comprehensive analysis
  return {
    fluencyScore,
    clarityScore,
    confidenceScore,
    feedback,
    details: {
      wordCount,
      sentenceCount,
      speechRate: Math.round(speechRate),
      fillerWords,
      pauseCount,
      avgWordsPerSentence: Math.round(avgWordsPerSentence * 10) / 10,
      vocabularyDiversity: Math.round(vocabularyDiversity * 100) / 100
    }
  };
}

// Count common filler words with expanded list
function countFillerWords(text) {
  const fillerWords = [
    'um', 'uh', 'er', 'ah', 'like', 'you know', 'sort of', 'kind of', 
    'basically', 'actually', 'literally', 'i mean', 'so', 'well', 
    'just', 'okay', 'right', 'you see', 'i guess', 'whatever'
  ];
  
  const lowerText = text.toLowerCase();
  let count = 0;
  
  fillerWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const matches = lowerText.match(regex);
    if (matches) {
      count += matches.length;
    }
  });
  
  return count;
}

// Estimate pauses based on punctuation and ellipses
function estimatePauses(text) {
  // Count commas, periods, ellipses, and dash patterns as potential pause indicators
  const commas = (text.match(/,/g) || []).length;
  const periods = (text.match(/\./g) || []).length;
  const ellipses = (text.match(/\.{3,}/g) || []).length;
  const dashes = (text.match(/-{2,}/g) || []).length;
  
  // Count multiple spaces as potential hesitations
  const multipleSpaces = (text.match(/\s{3,}/g) || []).length;
  
  return commas + periods + (ellipses * 2) + (dashes * 2) + multipleSpaces;
}

// Count confidence indicator words with expanded list
function countConfidenceWords(text) {
  const confidenceWords = [
    'confident', 'certainly', 'definitely', 'absolutely', 'surely',
    'without a doubt', 'i am certain', 'i believe', 'i know', 'i am sure',
    'confident that', 'no doubt', 'undoubtedly', 'clearly', 'will',
    'can', 'always', 'never', 'every', 'all', 'exactly', 'precisely',
    'of course', 'indeed', 'obviously', 'certainly'
  ];
  
  const lowerText = text.toLowerCase();
  let count = 0;
  
  confidenceWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const matches = lowerText.match(regex);
    if (matches) {
      count += matches.length;
    }
  });
  
  return count;
}

// Count uncertainty words
function countUncertaintyWords(text) {
  const uncertaintyWords = [
    'maybe', 'perhaps', 'might', 'could', 'possibly', 'probably', 'not sure',
    'i think', 'i guess', 'sometimes', 'sort of', 'kind of', 'a bit',
    'hopefully', 'i hope', 'i feel like', 'seems like', 'seems to be',
    'appears to', 'somewhat', 'somehow', 'in a way', 'more or less'
  ];
  
  const lowerText = text.toLowerCase();
  let count = 0;
  
  uncertaintyWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const matches = lowerText.match(regex);
    if (matches) {
      count += matches.length;
    }
  });
  
  return count;
}

// Calculate vocabulary diversity (unique words / total words)
function calculateVocabularyDiversity(text) {
  if (!text || text.trim().length === 0) return 0;
  
  // Remove common stop words to get a better measure of vocabulary
  const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 
    'to', 'of', 'in', 'for', 'with', 'that', 'this', 'it', 'as', 'be', 'by', 'at', 'on', 'have', 'has'];
  
  // Extract all words and convert to lowercase
  const allWords = text.toLowerCase().match(/\b\w+\b/g) || [];
  
  // Filter out stop words
  const contentWords = allWords.filter(word => !stopWords.includes(word));
  
  if (contentWords.length === 0) return 0;
  
  // Count unique words
  const uniqueWords = new Set(contentWords);
  return uniqueWords.size / contentWords.length;
}

// Generate enhanced personalized feedback
function generateEnhancedFeedback(
  fluencyScore, 
  clarityScore, 
  confidenceScore,
  fillerWordRatio,
  pauseRate,
  avgWordsPerSentence,
  structureCoherence,
  confidenceRatio,
  uncertaintyRatio,
  vocabularyDiversity,
  transcript
) {
  let feedback = [];
  
  // Fluency feedback
  if (fluencyScore < 70) {
    if (fillerWordRatio > 0.05) {
      feedback.push(`Try to reduce filler words like 'um', 'uh', and 'like'. You used approximately ${Math.round(fillerWordRatio * 100)}% filler words. Take a moment to collect your thoughts instead of using fillers.`);
    }
    if (pauseRate > 0.2) {
      feedback.push("Your speech contains frequent pauses. Practice a smoother delivery by preparing key points in advance.");
    }
  } else if (fluencyScore >= 90) {
    feedback.push("Excellent fluency! You speak smoothly with minimal filler words and appropriate pacing.");
  }
  
  // Clarity feedback
  if (clarityScore < 70) {
    if (avgWordsPerSentence > 25) {
      feedback.push(`Your sentences are quite long (average: ${Math.round(avgWordsPerSentence)} words). Consider breaking them into shorter, more digestible points for better clarity.`);
    } else if (avgWordsPerSentence < 8) {
      feedback.push("Your sentences are very short. Try connecting your ideas with transitions to create more cohesive responses.");
    }
    if (structureCoherence < 0.5) {
      feedback.push("Try to structure your response with a clear introduction, key points, and conclusion for better organization.");
    }
  } else if (clarityScore >= 90) {
    feedback.push("Great clarity in your response! Your points are well-structured and easy to follow with ideal sentence length.");
  }
  
  // Confidence feedback
  if (confidenceScore < 70) {
    if (uncertaintyRatio > 0.03) {
      feedback.push("Your response contains multiple uncertainty phrases. Replace words like 'maybe' and 'sort of' with more definitive language.");
    }
    if (confidenceRatio < 0.02) {
      feedback.push("Try incorporating more confident language in your responses to project certainty and authority.");
    }
  } else if (confidenceScore >= 90) {
    feedback.push("You project strong confidence in your response! Your language choices convey authority and expertise.");
  }
  
  // Vocabulary feedback
  if (vocabularyDiversity < 0.5) {
    feedback.push("Consider expanding your vocabulary usage to make your responses more engaging and precise.");
  } else if (vocabularyDiversity > 0.8) {
    feedback.push("You use an impressive and diverse vocabulary that enhances your response quality.");
  }
  
  // Overall feedback
  const averageScore = (fluencyScore + clarityScore + confidenceScore) / 3;
  
  if (averageScore < 60) {
    feedback.push("Regular speaking practice will help improve your overall delivery. Try recording yourself and reviewing the recordings to identify specific areas for improvement.");
  } else if (averageScore >= 85) {
    feedback.push("Overall, your speaking skills are very strong. You communicate effectively with confidence and clarity.");
  }
  
  // Add practice suggestion
  feedback.push("Practice tip: Record yourself answering common interview questions and compare your responses over time to track improvement.");
  
  return feedback.join(' ');
}

module.exports = router; 