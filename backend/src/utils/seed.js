require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Quiz = require('../models/Quiz');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  await User.deleteMany({});
  await Quiz.deleteMany({});

  const password = await bcrypt.hash('password123', 12);
  const admin = await User.create({
    username: 'quizmaster',
    email: 'admin@quizspark.com',
    password,
    role: 'admin',
  });

  const quizzes = [
    {
      title: 'JavaScript Fundamentals',
      topic: 'coding', difficulty: 'medium',
      description: 'Test your core JS knowledge',
      questions: [
        { text: 'What does typeof null return in JavaScript?', options: ['null','undefined','object','boolean'], correctIndex: 2, timeLimit: 15, points: 100 },
        { text: 'Which method removes the last element of an array?', options: ['shift()','unshift()','pop()','push()'], correctIndex: 2, timeLimit: 15, points: 100 },
        { text: 'What is a closure?', options: ['A loop construct','A function accessing its outer scope','A class method','A type of array'], correctIndex: 1, timeLimit: 20, points: 100 },
      ],
    },
    {
      title: 'World Science',
      topic: 'science', difficulty: 'easy',
      description: 'Basic science for everyone',
      questions: [
        { text: 'What is the chemical symbol for Gold?', options: ['Go','Gd','Au','Ag'], correctIndex: 2, timeLimit: 15, points: 100 },
        { text: 'How many bones are in the adult human body?', options: ['196','206','216','186'], correctIndex: 1, timeLimit: 15, points: 100 },
        { text: 'What planet is closest to the sun?', options: ['Venus','Mars','Earth','Mercury'], correctIndex: 3, timeLimit: 15, points: 100 },
      ],
    },
  ];

  for (const q of quizzes) {
    await Quiz.create({ ...q, creator: admin._id, isPublic: true });
  }

  console.log('Seed complete: 1 user, 2 quizzes');
  console.log('Login: admin@quizspark.com / password123');
  await mongoose.disconnect();
}

seed().catch(err => { console.error(err); process.exit(1); });
