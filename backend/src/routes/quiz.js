const router = require('express').Router();
const { protect, optionalAuth } = require('../middleware/auth');
const {
  createQuiz, getQuizzes, getQuiz, updateQuiz, deleteQuiz, duplicateQuiz
} = require('../controllers/quizController');

router.get('/',          optionalAuth, getQuizzes);
router.post('/',         protect,      createQuiz);
router.get('/:id',       optionalAuth, getQuiz);
router.put('/:id',       protect,      updateQuiz);
router.delete('/:id',    protect,      deleteQuiz);
router.post('/:id/duplicate', protect, duplicateQuiz);

module.exports = router;
