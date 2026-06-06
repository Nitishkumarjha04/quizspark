const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const quizRoutes = require('./routes/quiz');
const roomRoutes = require('./routes/room');
const userRoutes = require('./routes/user');

const app = express();

app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://heroic-madeleine-d82750.netlify.app'
  ],
  credentials: true
}));

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

app.get('/health', (req, res) => res.json({ status: 'ok', ts: Date.now() }));

app.use('/api/auth',  authRoutes);
app.use('/api/quiz',  quizRoutes);
app.use('/api/room',  roomRoutes);
app.use('/api/user',  userRoutes);

app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'Internal server error';
  if (process.env.NODE_ENV === 'development') console.error(err);
  res.status(status).json({ success: false, message });
});

module.exports = app;
