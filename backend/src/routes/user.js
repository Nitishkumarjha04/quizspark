const router = require('express').Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const Quiz = require('../models/Quiz');

router.get('/:username', async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username }).select('-password -email');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const quizzes = await Quiz.find({ creator: user._id, isPublic: true }).select('title topic playCount').lean();
    res.json({ success: true, user, quizzes });
  } catch (err) { next(err); }
});

module.exports = router;
