# QuizSpark — Industrial-Grade Live Quiz Platform

Full-stack live quiz app with real-time rooms, Socket.IO, JWT auth, and MongoDB.

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Vanilla HTML/CSS/JS SPA |
| Backend  | Node.js + Express + Socket.IO |
| Database | MongoDB (Mongoose) |
| Auth     | JWT (jsonwebtoken + bcryptjs) |
| Deploy   | Vercel (frontend) + Railway (backend) |

---

## Project structure

```
quizspark/
├── backend/
│   ├── src/
│   │   ├── index.js          # Entry point
│   │   ├── app.js            # Express setup
│   │   ├── config/db.js      # MongoDB connection
│   │   ├── models/           # User, Quiz, Room
│   │   ├── controllers/      # Auth, Quiz, Room logic
│   │   ├── routes/           # REST endpoints
│   │   ├── middleware/auth.js # JWT protect middleware
│   │   ├── socket/index.js   # Socket.IO real-time engine
│   │   └── utils/seed.js     # Database seeder
│   ├── .env.example
│   ├── package.json
│   └── railway.json
│
└── frontend/
    ├── public/
    │   ├── index.html        # SPA shell
    │   ├── config.js         # API URL config
    │   ├── css/main.css
    │   └── js/
    │       ├── api.js        # All API calls
    │       ├── auth.js       # Session management
    │       ├── router.js     # Client-side router
    │       ├── toast.js      # Notifications
    │       ├── app.js        # Boot + route definitions
    │       └── pages/        # One file per page
    ├── package.json
    └── vercel.json
```

---

## Local development

### 1. MongoDB Atlas (free tier)
1. Go to https://cloud.mongodb.com → create free cluster
2. Create a database user
3. Get your connection string (looks like `mongodb+srv://...`)

### 2. Backend setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env — set MONGODB_URI and JWT_SECRET

npm run seed    # (optional) seed demo data
npm run dev     # starts on http://localhost:4000
```

### 3. Frontend setup

```bash
cd frontend
# Edit public/config.js:
#   API_URL: 'http://localhost:4000'
#   WS_URL:  'http://localhost:4000'

npm install
npm run dev     # serves on http://localhost:3000
```

---

## Deploy: Backend → Railway

1. Push backend folder to a GitHub repo
2. Go to https://railway.app → New Project → Deploy from GitHub
3. Select your repo
4. Add environment variables in Railway dashboard:
   - `MONGODB_URI` = your Atlas connection string
   - `JWT_SECRET`  = any long random string
   - `CLIENT_URL`  = your Vercel frontend URL (set after step below)
   - `NODE_ENV`    = production
5. Railway auto-detects Node.js and uses `railway.json`
6. Copy your Railway URL (e.g. `https://quizspark-backend.railway.app`)

## Deploy: Frontend → Vercel

1. Push frontend folder to a GitHub repo
2. Go to https://vercel.com → New Project → Import
3. Set **Output Directory** to `public`
4. **Before deploying**, edit `public/config.js`:
   ```js
   const CONFIG = {
     API_URL: 'https://quizspark-backend.railway.app',
     WS_URL:  'https://quizspark-backend.railway.app',
   };
   ```
5. Deploy — Vercel uses `vercel.json` (SPA rewrites already set)
6. Copy your Vercel URL and set it as `CLIENT_URL` in Railway env vars
7. Redeploy Railway to apply the CORS update

---

## REST API

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Create account |
| POST | /api/auth/login    | Login, get JWT  |
| GET  | /api/auth/me       | Get current user |
| PATCH| /api/auth/me       | Update profile   |

### Quizzes
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET    | /api/quiz           | Optional | List public quizzes |
| POST   | /api/quiz           | Required | Create quiz |
| GET    | /api/quiz/:id       | Optional | Get single quiz |
| PUT    | /api/quiz/:id       | Owner    | Update quiz |
| DELETE | /api/quiz/:id       | Owner    | Delete quiz |
| POST   | /api/quiz/:id/duplicate | Required | Clone quiz |

### Rooms
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/room              | Required | Create room |
| GET  | /api/room/my           | Required | My rooms |
| GET  | /api/room/:code        | Optional | Get room info |
| GET  | /api/room/:code/results| Optional | Final results |

---

## Socket.IO Events

### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `room:host-join` | `{ code }` | Host joins their room |
| `room:join`      | `{ code, nickname, avatar }` | Player joins |
| `quiz:start`     | — | Host starts game |
| `answer:submit`  | `{ questionIndex, selectedIndex, timeTaken }` | Submit answer |
| `quiz:next`      | — | Host skips to next Q |
| `quiz:pause`     | — | Host pauses/resumes |

### Server → Client
| Event | Payload | Description |
|-------|---------|-------------|
| `room:state`         | `{ room }` | Initial room state |
| `room:players-updated` | `{ players }` | Player joined/left |
| `quiz:starting`      | `{ countdown }` | Countdown before start |
| `quiz:question`      | `{ index, text, options, timeLimit, … }` | New question |
| `answer:ack`         | `{ correct, pointsEarned, correctIndex }` | Answer feedback |
| `room:answer-stats`  | `{ answered, total }` | Host answer progress |
| `quiz:question-end`  | `{ leaderboard, correctIndex, explanation }` | End of question |
| `quiz:finished`      | `{ leaderboard }` | Game over |
| `error`              | `{ message }` | Error message |

---

## Scoring

Points are time-weighted: answer faster = more points.

```
points = basePoints × (0.5 + 0.5 × (1 - timeTaken / timeLimit))
```

At minimum (answer at the last second): 50% of base points.
At maximum (instant answer): 100% of base points.

---

## Features

- JWT authentication with bcrypt password hashing
- Quiz builder: up to 50 questions, 6 options each, per-question timer and points
- Live rooms with 6-character codes (e.g. `ABC123`)
- Up to 50 players per room
- Real-time leaderboard after every question
- Host controls: start, pause/resume, skip question
- Auto-advance timer server-side (no cheating)
- Stats saved to MongoDB after game ends
- Public/private quiz visibility
- Full text search on quizzes
- Rate limiting on all API routes
- CORS configured for production
