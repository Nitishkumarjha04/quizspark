const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');

function signToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

exports.register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { username, email, password } = req.body;

    const exists = await User.findOne({ $or: [{ email }, { username }] });
    if (exists) {
      return res.status(409).json({ success: false, message: 'Email or username already taken' });
    }

    const user = await User.create({ username, email, password });
    const token = signToken(user._id);

    res.status(201).json({ success: true, token, user: user.toPublic() });
  } catch (err) { next(err); }
};

exports.login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = signToken(user._id);
    res.json({ success: true, token, user: user.toPublic() });
  } catch (err) { next(err); }
};

exports.me = async (req, res) => {
  res.json({ success: true, user: req.user.toPublic() });
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { username, avatar } = req.body;
    const update = {};
    if (username) update.username = username;
    if (avatar !== undefined) update.avatar = avatar;

    const user = await User.findByIdAndUpdate(req.user._id, update, { new: true }).select('-password');
    res.json({ success: true, user });
  } catch (err) { next(err); }
};
exports.changePassword = async (req, res, next) => {
  try {

    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id);

    const valid = await user.comparePassword(currentPassword);

    if (!valid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password updated successfully'
    });

  } catch (err) {
    next(err);
  }
};
