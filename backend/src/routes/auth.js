const router = require('express').Router();
const { body } = require('express-validator');
const {
  register,
  login,
  me,
  updateProfile,
  changePassword
} = require('../controllers/authController');

const { protect } = require('../middleware/auth');

router.post('/register', [
  body('username').isLength({ min: 3, max: 30 }).trim(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
], register);

router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], login);

router.get('/me', protect, me);
router.patch('/me', protect, updateProfile);
router.patch('/change-password', protect, changePassword);

module.exports = router;
