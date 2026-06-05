const { validationResult } = require('express-validator');
const Quiz = require('../models/Quiz');
const User = require('../models/User');

exports.createQuiz = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const quiz = await Quiz.create({ ...req.body, creator: req.user._id });
    await User.findByIdAndUpdate(req.user._id, { $inc: { 'stats.quizzesCreated': 1 } });

    res.status(201).json({ success: true, quiz });
  } catch (err) { next(err); }
};

exports.getQuizzes = async (req, res, next) => {
  try {
    const { topic, difficulty, search, page = 1, limit = 12, mine } = req.query;
    const filter = {};

    if (mine === 'true' && req.user) {
      filter.creator = req.user._id;
    } else {
      filter.isPublic = true;
    }

    if (topic) filter.topic = topic;
    if (difficulty) filter.difficulty = difficulty;
    if (search) filter.$text = { $search: search };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [quizzes, total] = await Promise.all([
      Quiz.find(filter)
        .populate('creator', 'username avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Quiz.countDocuments(filter),
    ]);

    res.json({ success: true, quizzes, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
};

exports.getQuiz = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id).populate('creator', 'username avatar');
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });

    const isOwner = req.user && quiz.creator._id.equals(req.user._id);
    if (!quiz.isPublic && !isOwner) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, quiz });
  } catch (err) { next(err); }
};

exports.updateQuiz = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });
    if (!quiz.creator.equals(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const allowed = ['title', 'description', 'topic', 'difficulty', 'questions', 'isPublic', 'coverImage', 'tags'];
    allowed.forEach(key => {
      if (req.body[key] !== undefined) quiz[key] = req.body[key];
    });

    await quiz.save();
    res.json({ success: true, quiz });
  } catch (err) { next(err); }
};

exports.deleteQuiz = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });
    if (!quiz.creator.equals(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await quiz.deleteOne();
    res.json({ success: true, message: 'Quiz deleted' });
  } catch (err) { next(err); }
};

exports.duplicateQuiz = async (req, res, next) => {
  try {
    const original = await Quiz.findById(req.params.id);
    if (!original) return res.status(404).json({ success: false, message: 'Quiz not found' });

    const copy = await Quiz.create({
      title: `${original.title} (copy)`,
      description: original.description,
      topic: original.topic,
      difficulty: original.difficulty,
      questions: original.questions,
      creator: req.user._id,
      isPublic: false,
      tags: original.tags,
    });

    res.status(201).json({ success: true, quiz: copy });
  } catch (err) { next(err); }
};
