const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const Room = require('../models/Room');
const Quiz = require('../models/Quiz');
const User = require('../models/User');

const roomTimers = new Map();

function calcPoints(basePoints, timeTaken, timeLimit) {
  const ratio = Math.max(0, 1 - timeTaken / (timeLimit * 1000));
  return Math.round(basePoints * (0.5 + 0.5 * ratio));
}

function getLeaderboard(players) {
  return [...players]
    .sort((a, b) => b.score - a.score)
    .map((p, i) => ({ rank: i + 1, nickname: p.nickname, score: p.score, avatar: p.avatar }));
}

function initSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
  });

  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = await User.findById(decoded.id).select('-password');
      } catch {}
    }
    next();
  });

  io.on('connection', socket => {
    console.log(`Socket connected: ${socket.id} user=${socket.user?.username || 'guest'}`);

    // ── HOST: create room is via REST; host joins their room here
    socket.on('room:host-join', async ({ code }) => {
      try {
        const room = await Room.findOne({ code }).populate('quiz');
        if (!room) return socket.emit('error', { message: 'Room not found' });
        if (!socket.user || !room.host.equals(socket.user._id)) {
          return socket.emit('error', { message: 'Not the host' });
        }

        room.hostSocketId = socket.id;
        await room.save();

        socket.join(code);
        socket.roomCode = code;
        socket.isHost = true;

        socket.emit('room:state', { room: sanitizeRoom(room) });
      } catch (err) { socket.emit('error', { message: err.message }); }
    });

    // ── PLAYER: join room with nickname
    socket.on('room:join', async ({ code, nickname, avatar }) => {
      try {
        const room = await Room.findOne({ code: code.toUpperCase() }).populate('quiz');
        if (!room) return socket.emit('error', { message: 'Room not found' });
        if (room.status === 'finished') return socket.emit('error', { message: 'Game already finished' });
        if (room.players.length >= room.settings.maxPlayers) {
          return socket.emit('error', { message: 'Room is full' });
        }

        const existing = room.players.find(p => p.socketId === socket.id);
        if (!existing) {
          room.players.push({
            userId: socket.user?._id,
            socketId: socket.id,
            nickname: nickname || socket.user?.username || 'Anonymous',
            avatar: avatar || socket.user?.avatar || '',
            score: 0,
            answers: [],
          });
          await room.save();
        }

        socket.join(code);
        socket.roomCode = code;

        socket.emit('room:joined', { room: sanitizeRoom(room) });
        io.to(code).emit('room:players-updated', {
          players: room.players.map(p => ({ nickname: p.nickname, avatar: p.avatar, score: p.score })),
        });
      } catch (err) { socket.emit('error', { message: err.message }); }
    });

    // ── HOST: start game
    socket.on('quiz:start', async () => {
      try {
        const room = await Room.findOne({ code: socket.roomCode }).populate('quiz');
        if (!room) return socket.emit('error', { message: 'Room not found' });
        if (!socket.isHost) return socket.emit('error', { message: 'Only host can start' });
        if (room.status !== 'waiting') return socket.emit('error', { message: 'Game already started' });

        room.status = 'active';
        room.startedAt = new Date();
        room.currentQuestion = 0;
        await room.save();

        io.to(socket.roomCode).emit('quiz:starting', { countdown: 3 });

        setTimeout(() => {
          broadcastQuestion(io, socket.roomCode, room, 0);
        }, 3000);
      } catch (err) { socket.emit('error', { message: err.message }); }
    });

    // ── PLAYER: submit answer
    socket.on('answer:submit', async ({ questionIndex, selectedIndex, timeTaken }) => {
      try {
        const room = await Room.findOne({ code: socket.roomCode }).populate('quiz');
        if (!room || room.status !== 'active') return;
        if (room.currentQuestion !== questionIndex) return;

        const player = room.players.find(p => p.socketId === socket.id);
        if (!player) return;

        const alreadyAnswered = player.answers.find(a => a.questionIndex === questionIndex);
        if (alreadyAnswered) return;

        const question = room.quiz.questions[questionIndex];
        const correct = selectedIndex === question.correctIndex;
        const pointsEarned = correct ? calcPoints(question.points, timeTaken, question.timeLimit) : 0;

        player.answers.push({ questionIndex, selectedIndex, correct, timeTaken, pointsEarned });
        player.score += pointsEarned;
        await room.save();

        socket.emit('answer:ack', { correct, pointsEarned, correctIndex: question.correctIndex });

        const totalAnswered = room.players.filter(p =>
          p.answers.some(a => a.questionIndex === questionIndex)
        ).length;

        io.to(room.hostSocketId).emit('room:answer-stats', {
          answered: totalAnswered,
          total: room.players.length,
        });

        if (totalAnswered === room.players.length) {
          clearTimer(socket.roomCode);
          await advanceQuestion(io, socket.roomCode, room);
        }
      } catch (err) { socket.emit('error', { message: err.message }); }
    });

    // ── HOST: manually advance
    socket.on('quiz:next', async () => {
      if (!socket.isHost) return;
      try {
        const room = await Room.findOne({ code: socket.roomCode }).populate('quiz');
        if (!room) return;
        clearTimer(socket.roomCode);
        await advanceQuestion(io, socket.roomCode, room);
      } catch (err) { socket.emit('error', { message: err.message }); }
    });

    // ── HOST: pause/resume
    socket.on('quiz:pause', async () => {
      if (!socket.isHost) return;
      const room = await Room.findOne({ code: socket.roomCode });
      if (!room) return;
      room.status = room.status === 'paused' ? 'active' : 'paused';
      await room.save();
      io.to(socket.roomCode).emit('quiz:status', { status: room.status });
    });

    // ── DISCONNECT
    socket.on('disconnect', async () => {
      if (!socket.roomCode) return;

      try {
       const room = await Room.findOne({ code: socket.roomCode });
       if (!room) return;

       if (socket.isHost) {
        io.to(socket.roomCode).emit('room:host-left', {
        message: 'Host disconnected',
       });
       } else {

       if (room.status === 'waiting') {

        // Remove player only before game starts
        room.players = room.players.filter(
          p => p.socketId !== socket.id
        );

       } else {

        // Keep score and answers for leaderboard
        const player = room.players.find(
          p => p.socketId === socket.id
        );

        if (player) {
          player.socketId = null;
        }
      }

      await room.save();

      io.to(socket.roomCode).emit('room:players-updated', {
        players: room.players.map(p => ({
          nickname: p.nickname,
          avatar: p.avatar,
          score: p.score,
        })),
      });
    }
  } catch (err) {
    console.error(err);
  }
});
  });

  return io;
}

async function broadcastQuestion(io, code, room, index) {
  const question = room.quiz.questions[index];
  const payload = {
    index,
    total: room.quiz.questions.length,
    text: question.text,
    options: question.options,
    timeLimit: question.timeLimit,
    points: question.points,
    imageUrl: question.imageUrl,
  };

  io.to(code).emit('quiz:question', payload);

  const timer = setTimeout(async () => {
    const freshRoom = await Room.findOne({ code }).populate('quiz');
    if (!freshRoom || freshRoom.status !== 'active') return;
    await advanceQuestion(io, code, freshRoom);
  }, question.timeLimit * 1000);

  roomTimers.set(code, timer);
}

async function advanceQuestion(io, code, room) {
  const leaderboard = getLeaderboard(room.players);
  io.to(code).emit('quiz:question-end', {
    leaderboard,
    correctIndex: room.quiz.questions[room.currentQuestion].correctIndex,
    explanation: room.quiz.questions[room.currentQuestion].explanation,
  });

  const nextIndex = room.currentQuestion + 1;

  if (nextIndex >= room.quiz.questions.length) {
    room.status = 'finished';
    room.finishedAt = new Date();
    await room.save();

    await User.bulkWrite(
      room.players
        .filter(p => p.userId)
        .map(p => ({
          updateOne: {
            filter: { _id: p.userId },
            update: {
              $inc: {
                'stats.gamesPlayed': 1,
                'stats.totalScore': p.score,
                'stats.correctAnswers': p.answers.filter(a => a.correct).length,
                'stats.totalAnswers': p.answers.length,
              },
            },
          },
        }))
    );

    await Quiz.findByIdAndUpdate(room.quiz._id, { $inc: { playCount: 1 } });

    setTimeout(() => {
      io.to(code).emit('quiz:finished', { leaderboard, roomCode: code });
    }, 3000);
    return;
  }

  room.currentQuestion = nextIndex;
  await room.save();

  setTimeout(() => {
    broadcastQuestion(io, code, room, nextIndex);
  }, 4000);
}

function clearTimer(code) {
  if (roomTimers.has(code)) {
    clearTimeout(roomTimers.get(code));
    roomTimers.delete(code);
  }
}

function sanitizeRoom(room) {
  const r = room.toObject ? room.toObject() : room;
  if (r.quiz && r.quiz.questions) {
    r.quiz.questions = r.quiz.questions.map(q => ({
      _id: q._id,
      text: q.text,
      options: q.options,
      timeLimit: q.timeLimit,
      points: q.points,
      imageUrl: q.imageUrl,
    }));
  }
  return r;
}

module.exports = { initSocket };
