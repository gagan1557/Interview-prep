const mongoose = require('mongoose');
const Question = require('./models/Question');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Make sure we have a MongoDB URI
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('MongoDB URI is not defined in environment variables!');
  process.exit(1);
}

console.log('Using MongoDB URI:', MONGODB_URI);

// Sample questions for different job roles
const sampleQuestions = [
  // Software Engineer questions
  {
    text: 'Explain the difference between a stack and a queue and provide a real-world example of each.',
    jobRole: 'Software Engineer',
    category: 'technical',
    difficulty: 'beginner',
    isPredefined: true
  },
  {
    text: 'How would you implement a function to check if a binary tree is balanced?',
    jobRole: 'Software Engineer',
    category: 'technical',
    difficulty: 'intermediate',
    isPredefined: true
  },
  {
    text: 'Describe a time when you had to refactor a complex piece of code. What approach did you take?',
    jobRole: 'Software Engineer',
    category: 'behavioral',
    difficulty: 'intermediate',
    isPredefined: true
  },
  {
    text: 'Explain how you would design a distributed caching system.',
    jobRole: 'Software Engineer',
    category: 'technical',
    difficulty: 'advanced',
    isPredefined: true
  },
  {
    text: 'How do you stay updated with the latest programming technologies and trends?',
    jobRole: 'Software Engineer',
    category: 'behavioral',
    difficulty: 'beginner',
    isPredefined: true
  },

  // Software Developer questions
  {
    text: 'What is the difference between an abstract class and an interface?',
    jobRole: 'Software Developer',
    category: 'technical',
    difficulty: 'beginner',
    isPredefined: true
  },
  {
    text: 'Explain the concept of SOLID principles in software development.',
    jobRole: 'Software Developer',
    category: 'technical',
    difficulty: 'intermediate',
    isPredefined: true
  },
  {
    text: 'Describe a situation where you had to optimize code for performance. What techniques did you use?',
    jobRole: 'Software Developer',
    category: 'behavioral',
    difficulty: 'intermediate',
    isPredefined: true
  },
  {
    text: 'How would you implement a thread-safe singleton pattern?',
    jobRole: 'Software Developer',
    category: 'technical',
    difficulty: 'advanced',
    isPredefined: true
  },
  {
    text: 'How do you approach debugging a complex issue in production?',
    jobRole: 'Software Developer',
    category: 'behavioral',
    difficulty: 'intermediate',
    isPredefined: true
  },

  // Java Developer questions
  {
    text: 'Explain the difference between HashMap and ConcurrentHashMap in Java.',
    jobRole: 'Java Developer',
    category: 'technical',
    difficulty: 'intermediate',
    isPredefined: true
  },
  {
    text: 'What are the new features introduced in Java 8 and Java 11?',
    jobRole: 'Java Developer',
    category: 'technical',
    difficulty: 'intermediate',
    isPredefined: true
  },
  {
    text: 'Describe your experience with Spring Boot and Spring Framework.',
    jobRole: 'Java Developer',
    category: 'behavioral',
    difficulty: 'intermediate',
    isPredefined: true
  },
  {
    text: 'How would you optimize memory usage in a Java application?',
    jobRole: 'Java Developer',
    category: 'technical',
    difficulty: 'advanced',
    isPredefined: true
  },
  {
    text: 'Explain how garbage collection works in Java and how you would tune it.',
    jobRole: 'Java Developer',
    category: 'technical',
    difficulty: 'advanced',
    isPredefined: true
  },

  // Full Stack Developer questions
  {
    text: 'Explain the difference between server-side rendering and client-side rendering.',
    jobRole: 'Full Stack Developer',
    category: 'technical',
    difficulty: 'intermediate',
    isPredefined: true
  },
  {
    text: 'How do you handle state management in a modern frontend framework like React or Angular?',
    jobRole: 'Full Stack Developer',
    category: 'technical',
    difficulty: 'intermediate',
    isPredefined: true
  },
  {
    text: 'Describe your experience with building RESTful APIs and GraphQL.',
    jobRole: 'Full Stack Developer',
    category: 'behavioral',
    difficulty: 'intermediate',
    isPredefined: true
  },
  {
    text: 'How would you implement authentication and authorization in a full stack application?',
    jobRole: 'Full Stack Developer',
    category: 'technical',
    difficulty: 'intermediate',
    isPredefined: true
  },
  {
    text: 'Explain your approach to making a web application responsive and accessible.',
    jobRole: 'Full Stack Developer',
    category: 'technical',
    difficulty: 'intermediate',
    isPredefined: true
  },

  // Frontend Developer questions
  {
    text: 'Explain the box model in CSS and how box-sizing affects it.',
    jobRole: 'Frontend Developer',
    category: 'technical',
    difficulty: 'beginner',
    isPredefined: true
  },
  {
    text: 'How do you optimize the performance of a React application?',
    jobRole: 'Frontend Developer',
    category: 'technical',
    difficulty: 'intermediate',
    isPredefined: true
  },
  {
    text: 'Describe your experience with CSS preprocessors like SASS or LESS.',
    jobRole: 'Frontend Developer',
    category: 'behavioral',
    difficulty: 'intermediate',
    isPredefined: true
  },
  {
    text: 'How would you implement a responsive design without using a framework like Bootstrap?',
    jobRole: 'Frontend Developer',
    category: 'technical',
    difficulty: 'intermediate',
    isPredefined: true
  },
  {
    text: 'Explain the concept of virtual DOM and its advantages.',
    jobRole: 'Frontend Developer',
    category: 'technical',
    difficulty: 'intermediate',
    isPredefined: true
  },

  // Backend Developer questions
  {
    text: 'How would you design a scalable microservices architecture?',
    jobRole: 'Backend Developer',
    category: 'technical',
    difficulty: 'advanced',
    isPredefined: true
  },
  {
    text: 'Explain the concept of database normalization and when you might want to denormalize.',
    jobRole: 'Backend Developer',
    category: 'technical',
    difficulty: 'intermediate',
    isPredefined: true
  },
  {
    text: 'Describe your experience with handling database transactions and ensuring data integrity.',
    jobRole: 'Backend Developer',
    category: 'behavioral',
    difficulty: 'intermediate',
    isPredefined: true
  },
  {
    text: 'How would you implement a job queue system for asynchronous processing?',
    jobRole: 'Backend Developer',
    category: 'technical',
    difficulty: 'advanced',
    isPredefined: true
  },
  {
    text: 'Explain how you would secure an API from common vulnerabilities.',
    jobRole: 'Backend Developer',
    category: 'technical',
    difficulty: 'intermediate',
    isPredefined: true
  },

  // DevOps Engineer questions
  {
    text: 'Explain the concept of Infrastructure as Code and its benefits.',
    jobRole: 'DevOps Engineer',
    category: 'technical',
    difficulty: 'intermediate',
    isPredefined: true
  },
  {
    text: 'How would you set up a CI/CD pipeline for a microservices application?',
    jobRole: 'DevOps Engineer',
    category: 'technical',
    difficulty: 'advanced',
    isPredefined: true
  },
  {
    text: 'Describe your experience with container orchestration tools like Kubernetes.',
    jobRole: 'DevOps Engineer',
    category: 'behavioral',
    difficulty: 'intermediate',
    isPredefined: true
  },
  {
    text: 'How would you handle monitoring and alerting in a production environment?',
    jobRole: 'DevOps Engineer',
    category: 'technical',
    difficulty: 'intermediate',
    isPredefined: true
  },
  {
    text: 'Explain how you would implement automated disaster recovery for a critical system.',
    jobRole: 'DevOps Engineer',
    category: 'technical',
    difficulty: 'advanced',
    isPredefined: true
  },

  // Data Analyst questions
  {
    text: 'Explain the difference between supervised and unsupervised learning with examples.',
    jobRole: 'Data Analyst',
    category: 'technical',
    difficulty: 'beginner',
    isPredefined: true
  },
  {
    text: 'How would you handle missing data in a dataset before performing analysis?',
    jobRole: 'Data Analyst',
    category: 'technical',
    difficulty: 'intermediate',
    isPredefined: true
  },
  {
    text: 'Describe a time when your data analysis led to a significant business decision.',
    jobRole: 'Data Analyst',
    category: 'behavioral',
    difficulty: 'intermediate',
    isPredefined: true
  },
  {
    text: 'How would you explain a complex statistical concept to a non-technical stakeholder?',
    jobRole: 'Data Analyst',
    category: 'situational',
    difficulty: 'intermediate',
    isPredefined: true
  },
  {
    text: 'Explain how you would design an A/B testing framework for a new feature.',
    jobRole: 'Data Analyst',
    category: 'technical',
    difficulty: 'advanced',
    isPredefined: true
  },

  // Product Manager questions
  {
    text: 'How do you prioritize features for a product roadmap?',
    jobRole: 'Product Manager',
    category: 'technical',
    difficulty: 'intermediate',
    isPredefined: true
  },
  {
    text: 'Describe a time when you had to make a difficult product decision based on conflicting user feedback.',
    jobRole: 'Product Manager',
    category: 'behavioral',
    difficulty: 'intermediate',
    isPredefined: true
  },
  {
    text: 'How would you measure the success of a newly launched feature?',
    jobRole: 'Product Manager',
    category: 'technical',
    difficulty: 'beginner',
    isPredefined: true
  },
  {
    text: 'Your team is behind schedule for a critical product launch. How would you handle this situation?',
    jobRole: 'Product Manager',
    category: 'situational',
    difficulty: 'advanced',
    isPredefined: true
  },
  {
    text: 'Explain your process for gathering and incorporating user feedback into product development.',
    jobRole: 'Product Manager',
    category: 'behavioral',
    difficulty: 'beginner',
    isPredefined: true
  },

  // UI/UX Designer questions
  {
    text: 'Explain the difference between UX and UI design.',
    jobRole: 'UI/UX Designer',
    category: 'technical',
    difficulty: 'beginner',
    isPredefined: true
  },
  {
    text: 'Walk me through your design process from requirement gathering to final deliverable.',
    jobRole: 'UI/UX Designer',
    category: 'behavioral',
    difficulty: 'intermediate',
    isPredefined: true
  },
  {
    text: 'How do you ensure your designs are accessible to all users, including those with disabilities?',
    jobRole: 'UI/UX Designer',
    category: 'technical',
    difficulty: 'advanced',
    isPredefined: true
  },
  {
    text: "You've received conflicting feedback from stakeholders about a design. How would you resolve this?",
    jobRole: 'UI/UX Designer',
    category: 'situational',
    difficulty: 'intermediate',
    isPredefined: true
  },
  {
    text: 'Describe a time when you had to defend a design decision to skeptical stakeholders.',
    jobRole: 'UI/UX Designer',
    category: 'behavioral',
    difficulty: 'intermediate',
    isPredefined: true
  }
];

// Connect to MongoDB
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(async () => {
  console.log('Connected to MongoDB');
  
  try {
    // Clear existing questions
    await Question.deleteMany({});
    console.log('Cleared existing questions');
    
    // Insert sample questions
    await Question.insertMany(sampleQuestions);
    console.log(`Inserted ${sampleQuestions.length} sample questions`);
    
    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    // Close the connection
    mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
})
.catch(err => {
  console.error('MongoDB connection error:', err);
}); 