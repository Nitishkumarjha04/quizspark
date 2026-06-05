const { nanoid } = require('nanoid');
const Room = require('../models/Room');
const Quiz = require('../models/Quiz');

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

exports.createRoom = async (req, res, next) => {
  try {
    const { quizId, settings } = req.body;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });

    let code;
    let attempts = 0;
    do {
      code = generateCode();
      attempts++;
      if (attempts > 10) throw new Error('Could not generate unique room code');
    } while (await Room.findOne({ code, status: { $ne: 'finished' } }));

    const room = await Room.create({
      code,
      quiz: quizId,
      host: req.user._id,
      settings: settings || {},
    });

    await room.populate('quiz', 'title topic difficulty questions');
    res.status(201).json({ success: true, room });
  } catch (err) { next(err); }
};

exports.getRoom = async (req, res, next) => {
  try {
    const { code } = req.params;
    const room = await Room.findOne({ code: code.toUpperCase() })
      .populate('quiz', 'title topic difficulty questions coverImage')
      .populate('host', 'username avatar');

    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });

    res.json({ success: true, room });
  } catch (err) { next(err); }
};

exports.getMyRooms = async (req, res, next) => {
  try {
    const rooms = await Room.find({ host: req.user._id })
      .populate('quiz', 'title topic')
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    res.json({ success: true, rooms });
  } catch (err) { next(err); }
};

exports.getRoomResults = async (req, res, next) => {
  try {
    const room = await Room.findOne({ code: req.params.code.toUpperCase() })
      .populate('quiz', 'title questions')
      .lean();

    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });
    if (room.status !== 'finished') {
      return res.status(400).json({ success: false, message: 'Room not finished yet' });
    }

    const leaderboard = [...room.players]
      .sort((a, b) => b.score - a.score)
      .map((p, i) => ({ rank: i + 1, nickname: p.nickname, score: p.score, answers: p.answers }));

    res.json({ success: true, room, leaderboard });
  } catch (err) { next(err); }
};
