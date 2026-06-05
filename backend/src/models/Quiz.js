const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  text: { type: String, required: true, trim: true },
  options: {
    type: [String],
    validate: v => v.length >= 2 && v.length <= 6,
  },
  correctIndex: { type: Number, required: true, min: 0 },
  explanation: { type: String, default: '' },
  timeLimit: { type: Number, default: 15, min: 5, max: 120 },
  points: { type: Number, default: 100, min: 10, max: 1000 },
  imageUrl: { type: String, default: '' },
}, { _id: true });

const quizSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, default: '', maxlength: 500 },
  topic: {
    type: String,
    enum: ['coding', 'science', 'history', 'math', 'geography', 'sports', 'music', 'general', 'custom'],
    default: 'general',
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium',
  },
  questions: {
    type: [questionSchema],
    validate: v => v.length >= 1 && v.length <= 50,
  },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isPublic: { type: Boolean, default: true },
  coverImage: { type: String, default: '' },
  tags: [{ type: String, trim: true, maxlength: 30 }],
  playCount: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
}, { timestamps: true });

quizSchema.index({ creator: 1 });
quizSchema.index({ isPublic: 1, topic: 1 });
quizSchema.index({ title: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Quiz', quizSchema);
