const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const docxParser = require('docx-parser');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const Resume = require('../models/Resume');
const Question = require('../models/Question');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads/resumes');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Enhanced skill extraction with categories
function extractSkills(text) {
  // Technical skills
  const technicalSkills = [
    'javascript', 'react', 'angular', 'vue', 'node', 'express', 'mongodb', 'mysql',
    'postgresql', 'firebase', 'html', 'css', 'sass', 'less', 'bootstrap', 'tailwind',
    'python', 'django', 'flask', 'java', 'spring', 'c\\+\\+', 'c#', '.net', 'ruby', 'rails',
    'php', 'laravel', 'swift', 'kotlin', 'flutter', 'dart', 'react native', 'sql', 'nosql',
    'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'ci/cd', 'git', 'github',
    'rest api', 'graphql', 'redux', 'webpack', 'typescript', 'nextjs', 'gatsby',
    'machine learning', 'ai', 'data science', 'tensorflow', 'pytorch'
  ];
  
  // Soft skills
  const softSkills = [
    'leadership', 'communication', 'teamwork', 'problem solving', 'critical thinking',
    'time management', 'organization', 'adaptability', 'flexibility', 'creativity',
    'collaboration', 'presentation', 'negotiation', 'conflict resolution', 'mentoring',
    'agile', 'scrum', 'project management', 'customer service', 'attention to detail'
  ];
  
  const foundSkills = [];
  const lowerText = text.toLowerCase();
  
  // Check for technical skills
  for (const skill of technicalSkills) {
    // Create a properly escaped regex pattern
    const escapedSkill = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const skillRegex = new RegExp(`\\b${escapedSkill}\\b`, 'i');
    
    if (skillRegex.test(lowerText)) {
      // Use the original skill name (not the escaped version) for the result
      foundSkills.push(skill === 'c\\+\\+' ? 'c++' : skill);
    }
  }
  
  // Check for soft skills
  for (const skill of softSkills) {
    // Create a properly escaped regex pattern
    const escapedSkill = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const skillRegex = new RegExp(`\\b${escapedSkill}\\b`, 'i');
    
    if (skillRegex.test(lowerText)) {
      foundSkills.push(skill);
    }
  }
  
  return foundSkills;
}

// Extract education information
function extractEducation(text) {
  const education = [];
  
  // Common education keywords
  const educationKeywords = ['education', 'university', 'college', 'bachelor', 'master', 'phd', 'degree'];
  const degreeTypes = ['bachelor', 'master', 'phd', 'bs', 'ba', 'ms', 'ma', 'mba', 'associate'];
  
  // Find education section
  let educationSection = '';
  for (const keyword of educationKeywords) {
    const regex = new RegExp(`${keyword}[\\s\\S]*?(\\n\\n|$)`, 'i');
    const match = text.match(regex);
    if (match) {
      educationSection += match[0] + ' ';
    }
  }
  
  // Simple extraction for demo purposes
  // In a production app, you'd use more sophisticated NLP here
  const lines = educationSection.split('\n').filter(line => line.trim().length > 0);
  
  let currentInstitution = null;
  let currentDegree = null;
  
  for (const line of lines) {
    // Try to find institution names (university/college)
    if (line.toLowerCase().includes('university') || line.toLowerCase().includes('college') || line.toLowerCase().includes('institute')) {
      currentInstitution = line.trim();
    }
    
    // Try to find degree information
    for (const degree of degreeTypes) {
      if (line.toLowerCase().includes(degree)) {
        currentDegree = line.trim();
      }
    }
    
    // If we have both institution and degree, add to education
    if (currentInstitution && currentDegree) {
      education.push({
        institution: currentInstitution,
        degree: currentDegree,
        field: 'Unknown' // Would need more sophisticated parsing to extract field reliably
      });
      
      // Reset for next education entry
      currentInstitution = null;
      currentDegree = null;
    }
  }
  
  return education;
}

// Extract experience information
function extractExperience(text) {
  const experience = [];
  
  // Common experience keywords
  const experienceKeywords = ['experience', 'work', 'employment', 'job', 'career'];
  const companies = text.match(/[A-Z][a-zA-Z]*([ |-][A-Z][a-zA-Z]*){0,3}\b(?=.*?company|inc|corp|llc)/g) || [];
  
  // Find experience section
  let experienceSection = '';
  for (const keyword of experienceKeywords) {
    const regex = new RegExp(`${keyword}[\\s\\S]*?(\\n\\n|$)`, 'i');
    const match = text.match(regex);
    if (match) {
      experienceSection += match[0] + ' ';
    }
  }
  
  // Simple extraction - in a production app, use more sophisticated NLP
  const lines = experienceSection.split('\n').filter(line => line.trim().length > 0);
  
  for (const company of companies) {
    // For each company, try to find description in the lines
    const companyLines = lines.filter(line => line.includes(company));
    if (companyLines.length > 0) {
      const position = companyLines.find(line => 
        line.toLowerCase().includes('engineer') || 
        line.toLowerCase().includes('developer') || 
        line.toLowerCase().includes('manager') ||
        line.toLowerCase().includes('director') ||
        line.toLowerCase().includes('analyst')
      ) || 'Unknown Position';
      
      experience.push({
        company: company,
        position: position,
        description: companyLines.join(' '),
        current: experienceSection.toLowerCase().includes('present') || experienceSection.toLowerCase().includes('current')
      });
    }
  }
  
  return experience;
}

// Extract basic information
function extractBasics(text) {
  const basics = {
    name: '',
    email: '',
    phone: '',
    location: '',
    summary: '',
    title: ''
  };
  
  // Email extraction
  const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
  const emailMatch = text.match(emailRegex);
  if (emailMatch && emailMatch.length > 0) {
    basics.email = emailMatch[0];
  }
  
  // Phone extraction
  const phoneRegex = /(\+\d{1,2}\s?)?(\(\d{3}\)|\d{3})[-.\s]?\d{3}[-.\s]?\d{4}/g;
  const phoneMatch = text.match(phoneRegex);
  if (phoneMatch && phoneMatch.length > 0) {
    basics.phone = phoneMatch[0];
  }
  
  // Title - often at the beginning, right after the name
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  if (lines.length > 1) {
    // Name is likely the first line
    basics.name = lines[0].trim();
    
    // Title is likely the second line
    const titleCandidates = [
      'software engineer', 'developer', 'web developer', 'frontend', 'backend',
      'full stack', 'project manager', 'product manager', 'ux designer', 'ui designer'
    ];
    
    for (const candidate of titleCandidates) {
      if (lines[1].toLowerCase().includes(candidate)) {
        basics.title = lines[1].trim();
        break;
      }
    }
  }
  
  // Summary - often after contact details
  const summaryRegex = /summary|profile|objective/i;
  const summaryIndex = lines.findIndex(line => summaryRegex.test(line));
  if (summaryIndex >= 0 && summaryIndex + 1 < lines.length) {
    basics.summary = lines[summaryIndex + 1].trim();
  }
  
  return basics;
}

// Generate personalized questions based on resume content
async function generatePersonalizedQuestions(userId, resumeData) {
  const personalizedQuestions = [];
  
  // Skill-based questions
  if (resumeData.skills && resumeData.skills.length > 0) {
    for (const skill of resumeData.skills.slice(0, 3)) { // Take top 3 skills
      personalizedQuestions.push({
        user: userId,
        category: 'Technical Skills',
        question: `Can you explain how you've used ${skill} in your previous work?`,
        difficulty: 'Medium',
        isPersonalized: true
      });
    }
  }
  
  // Experience-based questions
  if (resumeData.experience && resumeData.experience.length > 0) {
    const latestJob = resumeData.experience[0];
    personalizedQuestions.push({
      user: userId,
      category: 'Work Experience',
      question: `At ${latestJob.company}, what was the most challenging project you worked on and how did you overcome the obstacles?`,
      difficulty: 'Medium',
      isPersonalized: true
    });
  }
  
  // Education-based questions
  if (resumeData.education && resumeData.education.length > 0) {
    const latestEducation = resumeData.education[0];
    personalizedQuestions.push({
      user: userId,
      category: 'Education',
      question: `How did your studies in ${latestEducation.field || 'your field'} at ${latestEducation.institution} prepare you for this role?`,
      difficulty: 'Easy',
      isPersonalized: true
    });
  }
  
  // Save questions to database
  if (personalizedQuestions.length > 0) {
    await Question.insertMany(personalizedQuestions);
  }
}

// Upload and process resume
router.post('/upload', auth, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a file' });
    }

    const filePath = req.file.path;
    const fileType = path.extname(req.file.originalname).toLowerCase();
    let extractedText = '';

    // Extract text based on file type
    try {
      if (fileType === '.pdf') {
        const pdfData = await fs.promises.readFile(filePath);
        const pdfResult = await pdfParse(pdfData);
        extractedText = pdfResult.text;
      } else if (fileType === '.docx' || fileType === '.doc') {
        extractedText = await new Promise((resolve, reject) => {
          docxParser.parseDocx(filePath, function(text) {
            resolve(text);
          });
        });
      }
    } catch (parseError) {
      console.error('Error parsing file:', parseError);
      return res.status(400).json({ message: 'Could not parse the uploaded file. The file may be corrupted or password-protected.' });
    }

    // If we couldn't extract text, return an error
    if (!extractedText) {
      return res.status(400).json({ message: 'Could not extract text from the uploaded file' });
    }

    try {
      // Delete any existing resumes for this user
      await Resume.deleteMany({ user: req.user.id });
    } catch (dbError) {
      console.error('Database error when deleting existing resumes:', dbError);
      return res.status(500).json({ message: 'Database error when processing your resume' });
    }

    // Extract structured data from resume
    const skills = extractSkills(extractedText);
    const education = extractEducation(extractedText);
    const experience = extractExperience(extractedText);
    const basics = extractBasics(extractedText);

    // Save resume data to database
    try {
      const resume = new Resume({
        user: req.user.id,
        fileName: req.file.originalname,
        fileType: fileType,
        filePath: filePath,
        extractedText: extractedText,
        basics: basics,
        skills: skills,
        experience: experience,
        education: education,
        parsedSuccessfully: true
      });

      await resume.save();

      // Generate personalized questions based on resume content
      try {
        await generatePersonalizedQuestions(req.user.id, {
          skills,
          experience,
          education,
          basics
        });
      } catch (questionError) {
        console.error('Error generating personalized questions:', questionError);
        // We'll continue even if question generation fails
      }

      res.status(201).json({
        message: 'Resume uploaded and processed successfully',
        resume: {
          id: resume._id,
          fileName: resume.fileName,
          skills: resume.skills,
          basics: {
            name: resume.basics.name,
            title: resume.basics.title
          }
        }
      });
    } catch (saveError) {
      console.error('Error saving resume to database:', saveError);
      return res.status(500).json({ message: 'Database error when saving your resume' });
    }
  } catch (error) {
    console.error('Resume upload error:', error);
    res.status(500).json({ message: 'Server error during resume upload: ' + error.message });
  }
});

// Get current user's resume
router.get('/', auth, async (req, res) => {
  try {
    const resume = await Resume.findOne({ user: req.user.id }).sort({ uploadDate: -1 });
    
    if (!resume) {
      return res.status(404).json({ message: 'No resume found' });
    }
    
    res.json(resume);
  } catch (error) {
    console.error('Get resume error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get personalized questions based on resume
router.get('/questions', auth, async (req, res) => {
  try {
    const questions = await Question.find({ 
      user: req.user.id,
      isPersonalized: true
    });
    
    res.json(questions);
  } catch (error) {
    console.error('Get personalized questions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 