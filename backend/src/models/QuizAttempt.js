const mongoose = require('mongoose');

const quizAttemptSchema = new mongoose.Schema({
  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true,
  },

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },

  playerName: {
    type: String,
    required: true,
    trim: true,
  },

  score: {
    type: Number,
    default: 0,
  },

  correctAnswers: {
    type: Number,
    default: 0,
  },

  totalQuestions: {
    type: Number,
    default: 0,
  },

  answers: [{
    questionIndex: Number,
    selectedIndex: Number,
    correct: Boolean,
  }],

  completedAt: {
    type: Date,
    default: Date.now,
  }

}, { timestamps: true });

quizAttemptSchema.index({ quiz: 1 });
quizAttemptSchema.index({ user: 1 });

module.exports = mongoose.model(
  'QuizAttempt',
  quizAttemptSchema
);