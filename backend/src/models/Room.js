const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  socketId: { type: String },
  nickname: { type: String, required: true },
  avatar:   { type: String, default: '' },
  score:    { type: Number, default: 0 },
  answers:  [{
    questionIndex: Number,
    selectedIndex: Number,
    correct:       Boolean,
    timeTaken:     Number,
    pointsEarned:  Number,
  }],
  isReady: { type: Boolean, default: false },
}, { _id: false });

const roomSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, length: 6 },
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  hostSocketId: { type: String },
  players: [playerSchema],
  status: {
    type: String,
    enum: ['waiting', 'starting', 'active', 'paused', 'finished'],
    default: 'waiting',
  },
  currentQuestion: { type: Number, default: 0 },
  settings: {
    maxPlayers:    { type: Number, default: 50 },
    showAnswers:   { type: Boolean, default: true },
    randomOrder:   { type: Boolean, default: false },
    autoAdvance:   { type: Boolean, default: true },
  },
  startedAt:  { type: Date },
  finishedAt: { type: Date },
}, { timestamps: true });

roomSchema.index({ code: 1 });
roomSchema.index({ host: 1 });
roomSchema.index({ status: 1 });

module.exports = mongoose.model('Room', roomSchema);
