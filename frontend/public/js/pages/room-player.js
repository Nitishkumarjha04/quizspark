let playerSocket = null;
let questionStartTime = null;

function renderRoomPlayer({ code }) {
  const params = new URLSearchParams(window.location.search);
  const nickname = params.get('nick') || Auth.getUser()?.username || 'Player';

  document.getElementById('view').innerHTML = `
    <div style="max-width:720px;margin:0 auto;padding:32px 24px;">
      <div id="player-view"><div class="spinner"></div></div>
    </div>`;

  if (playerSocket) { playerSocket.disconnect(); playerSocket = null; }

  const token = Auth.getToken();
  playerSocket = io(API.wsUrl(), { auth: { token } });

  playerSocket.on('connect', () => {
    playerSocket.emit('room:join', { code, nickname, avatar: Auth.getUser()?.avatar || '' });
  });

  playerSocket.on('room:joined', ({ room }) => renderPlayerWaiting(room, nickname));
  playerSocket.on('room:players-updated', ({ players }) => {
    const el = document.getElementById('p-player-count');
    if (el) el.textContent = `${players.length} player${players.length !== 1 ? 's' : ''} joined`;
  });

  playerSocket.on('quiz:starting',     ({ countdown }) => showPlayerCountdown(countdown));
  playerSocket.on('quiz:question',     (data) => renderPlayerQuestion(data));
  playerSocket.on('quiz:question-end', (data) => renderPlayerQuestionEnd(data));
  playerSocket.on('quiz:status',       ({ status }) => {
    if (status === 'paused') Toast.info('Host paused the game');
    else Toast.info('Game resumed');
  });
  playerSocket.on('quiz:finished',     ({ leaderboard }) => renderPlayerFinished(leaderboard));
  playerSocket.on('room:host-left',    () => {
    document.getElementById('player-view').innerHTML = `
      <div class="empty-state"><h3>Host disconnected</h3><p>The host has left the game</p><br><a href="/" class="btn-primary" data-link>Go home</a></div>`;
  });
  playerSocket.on('error', ({ message }) => {
    document.getElementById('player-view').innerHTML = `
      <div class="empty-state"><h3>${escapeHtml(message)}</h3><br><a href="/join" class="btn-primary" data-link>Try again</a></div>`;
  });
}

function renderPlayerWaiting(room, nickname) {
  document.getElementById('player-view').innerHTML = `
    <div class="room-waiting">
      <div style="font-size:48px;margin-bottom:12px;">🎮</div>
      <h2 style="font-family:'Syne',sans-serif;font-size:24px;font-weight:800;margin-bottom:6px;">You're in!</h2>
      <p style="color:var(--muted);margin-bottom:20px;">Joined as <strong style="color:var(--text);">${escapeHtml(nickname)}</strong></p>

      <div class="card" style="margin-bottom:20px;">
        <div style="font-size:12px;letter-spacing:0.1em;text-transform:uppercase;color:var(--muted);margin-bottom:6px;">Room code</div>
        <div style="font-family:'Syne',sans-serif;font-size:32px;font-weight:800;color:var(--accent);">${room.code}</div>
      </div>

      <div class="card" style="margin-bottom:24px;">
        <div style="font-family:'Syne',sans-serif;font-weight:700;margin-bottom:4px;">${escapeHtml(room.quiz?.title||'')}</div>
        <div style="font-size:13px;color:var(--muted);">${room.quiz?.questions?.length||0} questions</div>
      </div>

      <div id="p-player-count" style="color:var(--muted);font-size:14px;margin-bottom:16px;">${room.players?.length||1} player joined</div>
      <div style="display:flex;align-items:center;gap:10px;color:var(--muted);font-size:14px;">
        <div class="spinner" style="width:20px;height:20px;margin:0;border-width:2px;"></div>
        Waiting for the host to start…
      </div>
    </div>`;
}

function showPlayerCountdown(from) {
  document.getElementById('player-view').innerHTML = `<div class="countdown-display" id="p-cd">${from}</div>`;
  let n = from - 1;
  const t = setInterval(() => {
    const el = document.getElementById('p-cd');
    if (!el) { clearInterval(t); return; }
    if (n <= 0) { el.textContent = 'GO!'; clearInterval(t); return; }
    el.textContent = n--;
  }, 1000);
}

let playerTimerInterval = null;

function renderPlayerQuestion(data) {
  clearInterval(playerTimerInterval);
  questionStartTime = Date.now();
  const letters = ['A','B','C','D','E','F'];

  document.getElementById('player-view').innerHTML = `
    <div class="question-display">
      <div class="question-header">
        <div class="q-progress">Q ${data.index+1} / ${data.total}</div>
        <div class="timer-display" id="p-timer">${data.timeLimit}</div>
      </div>
      <div class="progress-bar"><div class="progress-fill" id="p-progress" style="width:0%"></div></div>
      <div class="q-text-large">${escapeHtml(data.text)}</div>
      <div class="options-grid-2" id="p-options">
        ${data.options.map((o, i) => `
          <button class="option-btn" data-idx="${i}" onclick="submitAnswer(${i},${data.index})">
            <div class="opt-letter">${letters[i]}</div>
            ${escapeHtml(o)}
          </button>`).join('')}
      </div>
      <div id="p-feedback" style="text-align:center;min-height:28px;font-size:15px;font-weight:500;"></div>
    </div>`;

  let t = data.timeLimit;
  const timerEl    = document.getElementById('p-timer');
  const progressEl = document.getElementById('p-progress');

  playerTimerInterval = setInterval(() => {
    t--;
    if (!timerEl) { clearInterval(playerTimerInterval); return; }
    timerEl.textContent = Math.max(0, t);
    progressEl.style.width = `${((data.timeLimit - t) / data.timeLimit) * 100}%`;
    if (t <= 5)  { timerEl.classList.add('danger'); timerEl.classList.remove('warn'); }
    else if (t <= Math.ceil(data.timeLimit * 0.4)) { timerEl.classList.add('warn'); }
    if (t <= 0) {
      clearInterval(playerTimerInterval);
      disableOptions();
      document.getElementById('p-feedback').textContent = "⏱ Time's up!";
      document.getElementById('p-feedback').style.color = 'var(--amber)';
    }
  }, 1000);
}

function submitAnswer(optIdx, questionIndex) {
  clearInterval(playerTimerInterval);
  const timeTaken = Date.now() - questionStartTime;
  disableOptions();
  document.querySelectorAll('.option-btn')[optIdx]?.classList.add('selected');
  document.getElementById('p-feedback').textContent = 'Answer submitted!';
  document.getElementById('p-feedback').style.color = 'var(--accent)';
  playerSocket.emit('answer:submit', { questionIndex, selectedIndex: optIdx, timeTaken });
}

playerSocket && (playerSocket._callbacks = playerSocket._callbacks || {});

// Listen for answer ack
function setupPlayerAnswerAck() {
  if (!playerSocket) return;
  playerSocket.on('answer:ack', ({ correct, pointsEarned, correctIndex }) => {
    const btns = document.querySelectorAll('.option-btn');
    btns[correctIndex]?.classList.add('correct');
    if (!correct) {
      btns.forEach((b, i) => { if (b.classList.contains('selected') && i !== correctIndex) b.classList.add('wrong'); });
    }
    const fb = document.getElementById('p-feedback');
    if (fb) {
      fb.textContent = correct ? `✓ Correct! +${pointsEarned} pts` : '✗ Wrong';
      fb.style.color = correct ? 'var(--green)' : 'var(--red)';
    }
  });
}

function disableOptions() {
  document.querySelectorAll('.option-btn').forEach(b => b.disabled = true);
}

function renderPlayerQuestionEnd({ leaderboard }) {
  clearInterval(playerTimerInterval);
  const user = Auth.getUser();
  const me = leaderboard.find(p => p.nickname === (user?.username || ''));
  document.getElementById('player-view').innerHTML = `
    <div style="max-width:560px;margin:0 auto;padding:24px;">
      ${me ? `<div style="text-align:center;margin-bottom:20px;"><div style="font-family:'Syne',sans-serif;font-size:28px;font-weight:800;color:var(--accent);">#${me.rank}</div><div style="color:var(--muted);">Your rank · ${me.score.toLocaleString()} pts</div></div>` : ''}
      <div class="section-title">Leaderboard</div>
      <div class="leaderboard">${renderLeaderboardRows(leaderboard)}</div>
      <div style="text-align:center;margin-top:20px;color:var(--muted);font-size:14px;display:flex;align-items:center;gap:8px;justify-content:center;">
        <div class="spinner" style="width:18px;height:18px;margin:0;border-width:2px;"></div> Next question coming…
      </div>
    </div>`;
}

function renderPlayerFinished(leaderboard) {
  clearInterval(playerTimerInterval);
  const user = Auth.getUser();
  const me = leaderboard.find(p => p.nickname === (user?.username || ''));
  document.getElementById('player-view').innerHTML = `
    <div style="max-width:560px;margin:0 auto;padding:24px;text-align:center;">
      <div style="font-size:52px;margin-bottom:12px;">${me?.rank===1?'🏆':me?.rank===2?'🥈':me?.rank===3?'🥉':'🎉'}</div>
      <h2 style="font-family:'Syne',sans-serif;font-size:28px;font-weight:800;margin-bottom:6px;">Game over!</h2>
      ${me ? `<p style="color:var(--muted);margin-bottom:24px;">You finished <strong style="color:var(--text);">#${me.rank}</strong> with <strong style="color:var(--accent);">${me.score.toLocaleString()} points</strong></p>` : ''}
      <div class="leaderboard" style="text-align:left;margin-bottom:28px;">${renderLeaderboardRows(leaderboard)}</div>
      <div class="btn-row">
        <a href="/join" class="btn-outline" data-link>Play again</a>
        <a href="/" class="btn-primary" data-link>Go home</a>
      </div>
    </div>`;
  if (playerSocket) { playerSocket.disconnect(); playerSocket = null; }
}
