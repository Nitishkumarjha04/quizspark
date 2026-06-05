let hostSocket = null;

function renderRoomHost({ code }) {
  if (!Auth.isLoggedIn()) { Router.navigate('/login'); return; }

  document.getElementById('view').innerHTML = `
    <div style="max-width:900px;margin:0 auto;padding:32px 24px;">
      <div id="host-view"><div class="spinner"></div></div>
    </div>`;

  if (hostSocket) { hostSocket.disconnect(); hostSocket = null; }

  const token = Auth.getToken();
  hostSocket = io(API.wsUrl(), { auth: { token } });

  hostSocket.on('connect', () => {
    hostSocket.emit('room:host-join', { code });
  });

  hostSocket.on('room:state', ({ room }) => renderWaitingRoom(room));
  hostSocket.on('room:players-updated', ({ players }) => updatePlayerList(players));
  hostSocket.on('quiz:starting',  ({ countdown }) => showCountdown(countdown));
  hostSocket.on('quiz:question',  (data) => renderHostQuestion(data));
  hostSocket.on('quiz:question-end', (data) => renderHostQuestionEnd(data));
  hostSocket.on('room:answer-stats', ({ answered, total }) => updateAnswerStats(answered, total));
  hostSocket.on('quiz:finished',  ({ leaderboard }) => renderHostFinished(leaderboard, code));
  hostSocket.on('error', ({ message }) => Toast.error(message));
  hostSocket.on('disconnect', () => Toast.info('Disconnected from server'));
}

function renderWaitingRoom(room) {
  const view = document.getElementById('host-view');
  view.innerHTML = `
    <div class="room-waiting">
      <div class="waiting-code-label">Room code</div>
      <div class="room-code-display">${room.code}</div>
      <p style="color:var(--muted);margin:12px 0 32px;">Share this code with players · Join at <strong style="color:var(--text);">${window.location.host}/join</strong></p>

      <div class="card" style="margin-bottom:24px;text-align:left;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
          <div class="section-title" style="margin-bottom:0;">Players waiting</div>
          <div id="player-count" style="font-family:'Syne',sans-serif;font-weight:700;color:var(--accent);">0</div>
        </div>
        <div id="player-list" class="players-grid"></div>
      </div>

      <div class="card" style="margin-bottom:24px;text-align:left;">
        <div class="section-title">Quiz: ${escapeHtml(room.quiz?.title||'')}</div>
        <div style="font-size:14px;color:var(--muted);">${room.quiz?.questions?.length||0} questions · ${room.quiz?.difficulty||''} · ${room.quiz?.topic||''}</div>
      </div>

      <button class="btn-primary" id="start-btn" style="padding:16px 48px;font-size:17px;" onclick="startGame()">Start game →</button>
    </div>`;
  updatePlayerList(room.players || []);
}

function updatePlayerList(players) {
  const el = document.getElementById('player-list');
  const countEl = document.getElementById('player-count');
  if (countEl) countEl.textContent = players.length;
  if (!el) return;
  if (!players.length) {
    el.innerHTML = `<div style="color:var(--muted);font-size:14px;grid-column:1/-1;">Waiting for players to join…</div>`;
    return;
  }
  el.innerHTML = players.map(p => `
    <div class="player-chip">
      <div class="player-avatar-sm">${(p.nickname||'?')[0].toUpperCase()}</div>
      <span>${escapeHtml(p.nickname||'Player')}</span>
    </div>`).join('');
}

function startGame() {
  document.getElementById('start-btn').disabled = true;
  hostSocket.emit('quiz:start');
}

function showCountdown(from) {
  const view = document.getElementById('host-view');
  view.innerHTML = `<div class="countdown-display" id="cd-num">${from}</div>`;
  let n = from - 1;
  const t = setInterval(() => {
    const el = document.getElementById('cd-num');
    if (!el) { clearInterval(t); return; }
    if (n <= 0) { el.textContent = 'GO!'; clearInterval(t); return; }
    el.textContent = n--;
  }, 1000);
}

let hostTimerInterval = null;
function renderHostQuestion(data) {
  clearInterval(hostTimerInterval);
  const view = document.getElementById('host-view');
  view.innerHTML = `
    <div class="question-display">
      <div class="question-header">
        <div class="q-progress">Question ${data.index+1} / ${data.total}</div>
        <div class="timer-display" id="host-timer">${data.timeLimit}</div>
      </div>
      <div class="progress-bar"><div class="progress-fill" id="host-progress" style="width:0%"></div></div>
      <div class="q-text-large">${escapeHtml(data.text)}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:24px;">
        ${data.options.map((o,i) => `
          <div style="background:var(--surface);border:1.5px solid var(--border);border-radius:var(--radius);padding:16px 18px;display:flex;gap:12px;align-items:flex-start;">
            <div class="opt-letter">${['A','B','C','D','E','F'][i]}</div>
            <span style="font-size:15px;">${escapeHtml(o)}</span>
          </div>`).join('')}
      </div>
      <div style="text-align:center;margin-bottom:16px;">
        <div id="answer-stats" style="font-size:15px;color:var(--muted);">Waiting for answers…</div>
      </div>
      <div style="display:flex;gap:10px;justify-content:center;">
        <button class="btn-outline" onclick="hostSocket.emit('quiz:pause')">⏸ Pause</button>
        <button class="btn-primary" onclick="hostSocket.emit('quiz:next')">Skip →</button>
      </div>
    </div>`;

  let t = data.timeLimit;
  const timerEl   = document.getElementById('host-timer');
  const progressEl = document.getElementById('host-progress');

  hostTimerInterval = setInterval(() => {
    t--;
    if (!timerEl) { clearInterval(hostTimerInterval); return; }
    timerEl.textContent = Math.max(0, t);
    progressEl.style.width = `${((data.timeLimit - t) / data.timeLimit) * 100}%`;
    if (t <= 5)  timerEl.classList.add('danger');
    else if (t <= Math.ceil(data.timeLimit * 0.4)) timerEl.classList.add('warn');
    if (t <= 0) clearInterval(hostTimerInterval);
  }, 1000);
}

function updateAnswerStats(answered, total) {
  const el = document.getElementById('answer-stats');
  if (el) el.textContent = `${answered} / ${total} answered`;
}

function renderHostQuestionEnd({ leaderboard, correctIndex, explanation }) {
  clearInterval(hostTimerInterval);
  const view = document.getElementById('host-view');
  view.innerHTML = `
    <div style="max-width:600px;margin:0 auto;padding:24px;">
      <div style="text-align:center;margin-bottom:24px;">
        <div style="font-size:28px;margin-bottom:6px;">📊 Results</div>
        ${explanation ? `<div class="explanation-box"><strong>Explanation:</strong> ${escapeHtml(explanation)}</div>` : ''}
      </div>
      <div class="section-title">Leaderboard</div>
      <div class="leaderboard">${renderLeaderboardRows(leaderboard)}</div>
      <div style="text-align:center;margin-top:24px;">
        <button class="btn-primary" style="padding:14px 40px;" onclick="hostSocket.emit('quiz:next')">Next question →</button>
      </div>
    </div>`;
}

function renderHostFinished(leaderboard, code) {
  clearInterval(hostTimerInterval);
  document.getElementById('host-view').innerHTML = `
    <div style="max-width:600px;margin:0 auto;padding:24px;text-align:center;">
      <div style="font-size:52px;margin-bottom:12px;">🏆</div>
      <h2 style="font-family:'Syne',sans-serif;font-size:28px;font-weight:800;margin-bottom:6px;">Game over!</h2>
      <p style="color:var(--muted);margin-bottom:28px;">Final standings</p>
      <div class="leaderboard" style="text-align:left;">${renderLeaderboardRows(leaderboard)}</div>
      <div class="btn-row" style="margin-top:28px;">
        <a href="/room/${code}/results" class="btn-outline" data-link>View full results</a>
        <a href="/dashboard" class="btn-primary" data-link>Back to dashboard</a>
      </div>
    </div>`;
  if (hostSocket) { hostSocket.disconnect(); hostSocket = null; }
}

function renderLeaderboardRows(leaderboard) {
  const medals = ['🥇','🥈','🥉'];
  return leaderboard.map((p, i) => `
    <div class="lb-row">
      <div class="lb-rank ${i===0?'gold':i===1?'silver':i===2?'bronze':''}">${medals[i]||p.rank}</div>
      <div class="player-avatar-sm">${(p.nickname||'?')[0].toUpperCase()}</div>
      <div class="lb-name">${escapeHtml(p.nickname)}</div>
      <div class="lb-score">${p.score.toLocaleString()}</div>
    </div>`).join('');
}
