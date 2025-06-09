const express = require('express');
const router = express.Router();
const Question = require('../models/Question');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// Initialize Gemini AI API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

// Get all available job roles
router.get('/job-roles', async (req, res) => {
  try {
    const jobRoles = await Question.distinct('jobRole');
    res.json(jobRoles);
  } catch (error) {
    console.error('Error fetching job roles:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get questions by job role
router.get('/:jobRole', async (req, res) => {
  try {
    const { jobRole } = req.params;
    const { category, difficulty, limit = 5, seed } = req.query;
    
    // Build filter object
    const filter = { jobRole };
    if (category) filter.category = category;
    if (difficulty) filter.difficulty = difficulty;
    
    // Find questions, with different sorting based on seed
    let questions;
    
    if (seed) {
      // Use seed to get different questions each time
      // We'll use it to determine the sort direction and fields
      const seedNum = parseInt(seed, 10) || Date.now();
      const sortOrder = seedNum % 2 === 0 ? 1 : -1; // Even seeds sort ascending, odd descending
      const sortField = seedNum % 3 === 0 ? 'createdAt' : (seedNum % 3 === 1 ? 'text' : '_id');
      
      questions = await Question.find(filter)
        .limit(parseInt(limit))
        .sort({ [sortField]: sortOrder });
    } else {
      // Default sorting
      questions = await Question.find(filter)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 });
    }
    
    // If we have enough questions, return them
    if (questions.length >= parseInt(limit)) {
      return res.json(questions);
    }
    
    // If we don't have enough predefined questions, generate some
    const numToGenerate = parseInt(limit) - questions.length;
    if (numToGenerate > 0) {
      try {
        // First try using Gemini API
        const generatedQuestions = await generateGeminiQuestions(jobRole, category, difficulty, numToGenerate, seed);
        
        // If we got questions back, use them
        if (generatedQuestions && generatedQuestions.length > 0) {
          return res.json([...questions, ...generatedQuestions]);
        } else {
          // Otherwise fall back to template-based generation
          console.log('Falling back to template-based question generation');
          const templateQuestions = generateTemplateQuestions(jobRole, category, difficulty, numToGenerate);
          await Question.insertMany(templateQuestions);
          return res.json([...questions, ...templateQuestions]);
        }
      } catch (error) {
        // If Gemini API fails, use template-based generation
        console.error('Gemini API error, falling back to templates:', error);
        const templateQuestions = generateTemplateQuestions(jobRole, category, difficulty, numToGenerate);
        await Question.insertMany(templateQuestions);
        return res.json([...questions, ...templateQuestions]);
      }
    }
    
    res.json(questions);
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Generate questions using Gemini API
async function generateGeminiQuestions(jobRole, category, difficulty, numQuestions, seed) {
  try {
    // Use the seed to make the prompt unique
    const uniquePromptId = seed || Date.now();
    
    // Define prompt based on job role, category, and difficulty
    let prompt = `Generate ${numQuestions} unique interview ${category || ''} questions for a ${jobRole} position`;
    if (difficulty) {
      prompt += ` with ${difficulty} difficulty level`;
    }
    prompt += `. Make these questions unique and different from previous questions. (Request ID: ${uniquePromptId})`;
    prompt += `. Format the response as a JSON array of objects with text property for each question. For example: [{"text":"Question 1 here?"},{"text":"Question 2 here?"}]`;

    // Call Gemini API
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse response and format as questions
    let parsedQuestions = [];
    
    try {
      // Extract JSON from the response
      const jsonMatch = text.match(/\[.*\]/s);
      if (jsonMatch) {
        parsedQuestions = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback: extract questions line by line
        const lines = text.split('\n').filter(line => 
          line.trim() && !line.trim().startsWith('```') && !line.trim().startsWith('/*')
        );
        
        parsedQuestions = lines.map(line => {
          // Clean the line
          const cleanLine = line.replace(/^\d+\.\s*/, '').replace(/"/g, '').trim();
          return { text: cleanLine };
        });
      }
    } catch (e) {
      console.error('Error parsing Gemini response:', e);
      // Create simple question objects as fallback
      const lines = text.split('\n').filter(line => 
        line.trim() && !line.trim().startsWith('```') && !line.trim().startsWith('/*')
      );
      
      parsedQuestions = lines.map(line => {
        const cleanLine = line.replace(/^\d+\.\s*/, '').replace(/"/g, '').trim();
        return { text: cleanLine };
      });
    }

    // Format and save the generated questions
    const generatedQuestions = parsedQuestions
      .filter(q => q && q.text) // Filter out any invalid entries
      .slice(0, numQuestions) // Limit to the requested number
      .map(q => ({
        text: typeof q === 'string' ? q : q.text,
        jobRole,
        category: category || 'technical',
        difficulty: difficulty || 'intermediate',
        isPredefined: false,
        createdAt: new Date()
      }));

    // Save generated questions to database
    await Question.insertMany(generatedQuestions);

    return generatedQuestions;
  } catch (error) {
    console.error('Error generating Gemini questions:', error);
    throw error; // Re-throw the error to trigger the fallback
  }
}

// Generate questions using templates as a fallback
function generateTemplateQuestions(jobRole, category, difficulty, numQuestions) {
  // Templates for different categories
  const templates = {
    technical: [
      `What is your experience with {tech} in a {jobRole} role?`,
      `How would you implement {feature} for a {jobRole} project?`,
      `Explain the difference between {conceptA} and {conceptB} in {domain}.`,
      `How would you optimize {component} performance in a {jobRole} project?`,
      `What testing strategies would you use for {feature} as a {jobRole}?`,
      `How would you handle {problem} in a {jobRole} role?`,
      `What is your approach to debugging {issue} as a {jobRole}?`,
      `How would you design a {system} architecture as a {jobRole}?`,
      `Explain how you would implement {pattern} in a {jobRole} context.`,
      `What tools or frameworks do you prefer for {task} as a {jobRole} and why?`
    ],
    behavioral: [
      `Describe a challenging project you worked on as a {jobRole} and how you overcame obstacles.`,
      `How do you stay updated with the latest trends in {domain} for your {jobRole} position?`,
      `Tell me about a time you had to make a difficult technical decision as a {jobRole}.`,
      `How do you prioritize tasks and manage your time effectively as a {jobRole}?`,
      `Describe a situation where you had to collaborate with a difficult team member on a {jobRole} project.`,
      `How do you approach learning new technologies required for your {jobRole} position?`,
      `Tell me about a time you received critical feedback as a {jobRole} and how you responded.`,
      `How do you handle tight deadlines in your {jobRole} responsibilities?`,
      `Describe a situation where you had to explain a complex technical concept to a non-technical stakeholder.`,
      `How do you ensure code quality in your {jobRole} work?`
    ],
    situational: [
      `You're given a project with unclear requirements as a {jobRole}. How would you proceed?`,
      `A critical production bug is reported in your {feature}. What steps would you take to resolve it?`,
      `Your team disagrees on the technical approach for a {jobRole} project. How would you handle this?`,
      `You notice a security vulnerability in your {component}. What would you do?`,
      `Your {jobRole} team is behind schedule on an important delivery. How would you address this?`,
      `A new {technology} is being adopted by your team. How would you approach learning it?`,
      `You're asked to review a poorly written code for a {feature}. How would you provide feedback?`,
      `You've been assigned to maintain legacy {system} code. What would be your strategy?`,
      `How would you onboard a new {jobRole} team member to your current project?`,
      `You're tasked with improving performance of a slow {component}. What would be your approach?`
    ]
  };
  
  // Default to technical if category not provided or invalid
  const categoryToUse = category && templates[category] ? category : 'technical';
  
  // Tech concepts for different job roles
  const techConcepts = {
    'Software Engineer': {
      techs: ['data structures', 'algorithms', 'design patterns', 'CI/CD', 'microservices'],
      features: ['authentication system', 'caching layer', 'API gateway', 'data pipeline', 'search functionality'],
      domains: ['web development', 'cloud computing', 'distributed systems', 'database management'],
      conceptPairs: [
        { a: 'inheritance', b: 'composition' },
        { a: 'REST', b: 'GraphQL' },
        { a: 'microservices', b: 'monoliths' },
        { a: 'SQL', b: 'NoSQL databases' }
      ],
      components: ['database queries', 'frontend rendering', 'API endpoints', 'authentication flow'],
      problems: ['race conditions', 'memory leaks', 'API latency', 'scalability issues'],
      issues: ['inconsistent data', 'service outages', 'performance bottlenecks', 'security vulnerabilities'],
      systems: ['payment processing', 'content delivery', 'messaging', 'authentication'],
      patterns: ['singleton', 'factory', 'observer', 'dependency injection'],
      tasks: ['continuous integration', 'code review', 'performance optimization', 'data modeling']
    },
    'Software Developer': {
      techs: ['object-oriented programming', 'functional programming', 'web frameworks', 'version control', 'unit testing'],
      features: ['user authentication', 'file upload system', 'reporting dashboard', 'notification service'],
      domains: ['backend development', 'frontend development', 'mobile development', 'API design'],
      conceptPairs: [
        { a: 'promises', b: 'async/await' },
        { a: 'client-side rendering', b: 'server-side rendering' },
        { a: 'mutable state', b: 'immutable state' },
        { a: 'callbacks', b: 'event listeners' }
      ],
      components: ['UI components', 'business logic', 'data access layer', 'service integrations'],
      problems: ['cross-browser compatibility', 'state management', 'responsive design', 'accessibility issues'],
      issues: ['UI bugs', 'performance issues', 'compatibility problems', 'regression bugs'],
      systems: ['content management', 'inventory tracking', 'user management', 'analytics'],
      patterns: ['MVC', 'MVVM', 'repository pattern', 'module pattern'],
      tasks: ['debugging', 'deployment', 'testing', 'documentation']
    },
    'Frontend Developer': {
      techs: ['React', 'Angular', 'Vue.js', 'CSS preprocessors', 'JavaScript frameworks'],
      features: ['drag-and-drop interface', 'form validation', 'infinite scrolling', 'interactive charts'],
      domains: ['UI/UX design', 'responsive design', 'single-page applications', 'progressive web apps'],
      conceptPairs: [
        { a: 'Flexbox', b: 'CSS Grid' },
        { a: 'controlled components', b: 'uncontrolled components' },
        { a: 'client-side routing', b: 'server-side routing' },
        { a: 'virtual DOM', b: 'shadow DOM' }
      ],
      components: ['modal dialogs', 'navigation menus', 'form elements', 'data visualizations'],
      problems: ['browser compatibility', 'responsive layouts', 'accessibility', 'performance optimization'],
      issues: ['layout shifts', 'rendering performance', 'state management bugs', 'animation glitches'],
      systems: ['theme system', 'component library', 'form management', 'state management'],
      patterns: ['container/presentational', 'render props', 'higher-order components', 'hooks'],
      tasks: ['CSS styling', 'animation', 'form handling', 'API integration']
    },
    // Add other job roles with their specific concepts here...
  };
  
  // Use generic concepts if specific job role not found
  const genericTechConcepts = {
    techs: ['programming', 'frameworks', 'software tools', 'development methodologies'],
    features: ['user authentication', 'data processing', 'reporting', 'integration'],
    domains: ['software development', 'system design', 'programming languages', 'web technologies'],
    conceptPairs: [
      { a: 'concept A', b: 'concept B' },
      { a: 'approach X', b: 'approach Y' }
    ],
    components: ['frontend', 'backend', 'database', 'API'],
    problems: ['technical debt', 'scaling issues', 'security concerns', 'maintenance challenges'],
    issues: ['bugs', 'performance issues', 'compatibility problems', 'security vulnerabilities'],
    systems: ['software solution', 'technical architecture', 'technology stack', 'framework selection'],
    patterns: ['design pattern', 'architectural approach', 'coding standard', 'best practice'],
    tasks: ['implementation', 'testing', 'debugging', 'documentation']
  };
  
  // Get concepts for the current job role, or use generic concepts as fallback
  const concepts = techConcepts[jobRole] || genericTechConcepts;
  
  // Generate questions by replacing placeholders in templates
  const generatedQuestions = [];
  
  for (let i = 0; i < numQuestions; i++) {
    // Select a random template from the appropriate category
    const randomTemplateIndex = Math.floor(Math.random() * templates[categoryToUse].length);
    let questionText = templates[categoryToUse][randomTemplateIndex];
    
    // Replace placeholders with random concepts
    questionText = questionText.replace(/{jobRole}/g, jobRole);
    
    if (questionText.includes('{tech}')) {
      const randomTech = concepts.techs[Math.floor(Math.random() * concepts.techs.length)];
      questionText = questionText.replace(/{tech}/g, randomTech);
    }
    
    if (questionText.includes('{feature}')) {
      const randomFeature = concepts.features[Math.floor(Math.random() * concepts.features.length)];
      questionText = questionText.replace(/{feature}/g, randomFeature);
    }
    
    if (questionText.includes('{domain}')) {
      const randomDomain = concepts.domains[Math.floor(Math.random() * concepts.domains.length)];
      questionText = questionText.replace(/{domain}/g, randomDomain);
    }
    
    if (questionText.includes('{conceptA}') && questionText.includes('{conceptB}')) {
      const randomPair = concepts.conceptPairs[Math.floor(Math.random() * concepts.conceptPairs.length)];
      questionText = questionText.replace(/{conceptA}/g, randomPair.a).replace(/{conceptB}/g, randomPair.b);
    }
    
    if (questionText.includes('{component}')) {
      const randomComponent = concepts.components[Math.floor(Math.random() * concepts.components.length)];
      questionText = questionText.replace(/{component}/g, randomComponent);
    }
    
    if (questionText.includes('{problem}')) {
      const randomProblem = concepts.problems[Math.floor(Math.random() * concepts.problems.length)];
      questionText = questionText.replace(/{problem}/g, randomProblem);
    }
    
    if (questionText.includes('{issue}')) {
      const randomIssue = concepts.issues[Math.floor(Math.random() * concepts.issues.length)];
      questionText = questionText.replace(/{issue}/g, randomIssue);
    }
    
    if (questionText.includes('{system}')) {
      const randomSystem = concepts.systems[Math.floor(Math.random() * concepts.systems.length)];
      questionText = questionText.replace(/{system}/g, randomSystem);
    }
    
    if (questionText.includes('{pattern}')) {
      const randomPattern = concepts.patterns[Math.floor(Math.random() * concepts.patterns.length)];
      questionText = questionText.replace(/{pattern}/g, randomPattern);
    }
    
    if (questionText.includes('{task}')) {
      const randomTask = concepts.tasks[Math.floor(Math.random() * concepts.tasks.length)];
      questionText = questionText.replace(/{task}/g, randomTask);
    }
    
    if (questionText.includes('{technology}')) {
      const randomTech = concepts.techs[Math.floor(Math.random() * concepts.techs.length)];
      questionText = questionText.replace(/{technology}/g, randomTech);
    }
    
    // Add to the list of generated questions
    generatedQuestions.push({
      text: questionText,
      jobRole,
      category: categoryToUse,
      difficulty: difficulty || 'intermediate',
      isPredefined: false,
      createdAt: new Date()
    });
  }
  
  return generatedQuestions;
}

// Add a new predefined question
router.post('/', async (req, res) => {
  try {
    const { text, jobRole, category, difficulty } = req.body;
    
    // Validate required fields
    if (!text || !jobRole || !category || !difficulty) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    // Create new question
    const newQuestion = new Question({
      text,
      jobRole,
      category,
      difficulty,
      isPredefined: true
    });
    
    // Save question
    await newQuestion.save();
    
    res.status(201).json(newQuestion);
  } catch (error) {
    console.error('Error adding question:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;