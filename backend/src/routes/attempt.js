const router = require('express').Router();

const {
  submitAttempt,
  getAttempts
} = require('../controllers/attemptController');

const { optionalAuth } = require('../middleware/auth');

router.post(
  '/:id/attempt',
  optionalAuth,
  submitAttempt
);

router.get(
  '/:id/attempts',
  getAttempts
);

module.exports = router;