const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');

exports.submitAttempt = async (req, res, next) => {
  try {
       console.log('Attempt received');
        console.log(req.body);
    const { id } = req.params;

    const {
      playerName,
      score,
      correctAnswers,
      totalQuestions,
      answers
    } = req.body;

    const quiz = await Quiz.findById(id);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    const attempt = await QuizAttempt.create({
      quiz: id,
      user: req.user?._id || null,
      playerName,
      score,
      correctAnswers,
      totalQuestions,
      answers
    });

    res.status(201).json({
      success: true,
      attempt
    });

  } catch (err) {
    next(err);
  }
};

exports.getAttempts = async (req, res, next) => {
  try {

    const attempts = await QuizAttempt.find({
      quiz: req.params.id
    })
    .sort({ score: -1 })
    .limit(100);

    res.json({
      success: true,
      attempts
    });

  } catch (err) {
    next(err);
  }
};