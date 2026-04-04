require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Question = require('./models/Question');
const connectDB = require('./config/db');

const users = [
  {
    name: 'Admin User',
    email: 'admin@interviewprep.com',
    password: 'admin123',
    role: 'admin'
  },
  {
    name: 'Test User',
    email: 'user@interviewprep.com',
    password: 'user123',
    role: 'user'
  }
];

const questions = [
  {
    title: 'What is the difference between var, let, and const in JavaScript?',
    description: 'Explain the differences between var, let, and const keywords in JavaScript including scoping rules, hoisting, and reassignment capabilities.',
    category: 'Technical',
    difficulty: 'Easy',
    keywords: ['var', 'let', 'const', 'scope', 'hoisting', 'reassignment'],
    sampleAnswer: 'var is function-scoped and can be redeclared and reassigned. let is block-scoped and can be reassigned but not redeclared. const is block-scoped and cannot be reassigned or redeclared, though objects declared with const can still have their properties modified.'
  },
  {
    title: 'Explain the concept of closures in JavaScript',
    description: 'What are closures in JavaScript? Provide an example and explain how they work.',
    category: 'Technical',
    difficulty: 'Medium',
    keywords: ['closure', 'scope', 'lexical environment', 'function'],
    sampleAnswer: 'A closure is a function that has access to variables from its outer (enclosing) scope, even after the outer function has returned.'
  },
  {
    title: 'What is the Virtual DOM?',
    description: 'Explain the Virtual DOM concept and how it improves performance in frameworks like React.',
    category: 'Technical',
    difficulty: 'Medium',
    keywords: ['virtual dom', 'real dom', 'reconciliation', 'react', 'performance'],
    sampleAnswer: 'The Virtual DOM is a lightweight copy of the actual DOM. React compares changes and updates only necessary parts.'
  },
  {
    title: 'Describe the SOLID principles',
    description: 'Explain each of the SOLID principles in object-oriented design.',
    category: 'Technical',
    difficulty: 'Hard',
    keywords: ['solid', 'single responsibility', 'open closed', 'liskov substitution', 'interface segregation', 'dependency inversion'],
    sampleAnswer: 'SOLID principles: Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion.'
  },
  {
    title: 'How would you handle a difficult team member?',
    description: 'Describe a situation where you had to work with a difficult team member and how you handled it.',
    category: 'Behavioral',
    difficulty: 'Medium',
    keywords: ['conflict resolution', 'communication', 'empathy', 'teamwork', 'professional'],
    sampleAnswer: 'I would understand their perspective, communicate openly, and work toward a constructive solution.'
  },
  {
    title: 'Tell me about a time you failed',
    description: 'Share an example of a failure you experienced and what you learned from it.',
    category: 'Behavioral',
    difficulty: 'Easy',
    keywords: ['failure', 'learning', 'growth', 'self-awareness', 'improvement'],
    sampleAnswer: 'I once underestimated a project timeline and missed a deadline. I learned to plan better and communicate risks earlier.'
  },
  {
    title: 'Why should we hire you?',
    description: 'What makes you the best candidate for this position?',
    category: 'Behavioral',
    difficulty: 'Easy',
    keywords: ['strengths', 'value proposition', 'skills', 'experience', 'fit'],
    sampleAnswer: 'I combine technical skills, problem-solving ability, and a strong work ethic.'
  },
  {
    title: 'Design a URL shortening service',
    description: 'Design a service like bit.ly that can handle millions of URLs.',
    category: 'System Design',
    difficulty: 'Hard',
    keywords: ['url shortening', 'database', 'api', 'scalability', 'cache', 'hash function'],
    sampleAnswer: 'Use API servers, database for metadata, caching layer like Redis, and hashing for URL generation.'
  },
  {
    title: 'Design a chat application',
    description: 'Design a real-time chat application like WhatsApp.',
    category: 'System Design',
    difficulty: 'Hard',
    keywords: ['websocket', 'real-time', 'scalability', 'database', 'message queue', 'encryption'],
    sampleAnswer: 'Use WebSockets for communication, message queue for processing, NoSQL storage, and encryption.'
  },
  {
    title: 'Design a traffic light system',
    description: 'Design a traffic light controller system.',
    category: 'System Design',
    difficulty: 'Medium',
    keywords: ['state machine', 'embedded systems', 'timing', 'safety', 'controller'],
    sampleAnswer: 'Implement a state machine controlling traffic signals with timers and safety checks.'
  }
];

const seedDatabase = async () => {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    await User.deleteMany({});
    console.log('Users cleared');

    await Question.deleteMany({});
    console.log('Questions cleared');

    for (const userData of users) {
      await User.create(userData);
    }

    console.log('Users seeded');

    const adminUser = await User.findOne({ role: 'admin' });

    if (!adminUser) {
      throw new Error('Admin user not found for question seeding');
    }

    for (const question of questions) {
      await Question.create({
        ...question,
        createdBy: adminUser._id
      });
    }

    console.log('Questions seeded');

    console.log('Seed completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedDatabase();