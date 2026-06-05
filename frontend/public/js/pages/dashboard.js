async function renderDashboard() {
  if (!Auth.isLoggedIn()) { Router.navigate('/login'); return; }
  const user = Auth.getUser();

  document.getElementById('view').innerHTML = `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Dashboard</h1>
          <p class="page-sub">Welcome back, ${escapeHtml(user.username)}</p>
        </div>
        <a href="/quiz/new" class="btn-primary" data-link>+ New quiz</a>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-bottom:36px;" id="stats-row">
        <div class="stat-card"><div class="stat-num accent" id="st-created">—</div><div class="stat-label">Quizzes created</div></div>
        <div class="stat-card"><div class="stat-num green"  id="st-played">—</div><div class="stat-label">Games played</div></div>
        <div class="stat-card"><div class="stat-num accent" id="st-score">—</div><div class="stat-label">Total score</div></div>
        <div class="stat-card"><div class="stat-num green"  id="st-acc">—</div><div class="stat-label">Accuracy</div></div>
      </div>

      <div class="section-title">My quizzes</div>
      <div id="my-quizzes"><div class="spinner"></div></div>

      <div class="section-title" style="margin-top:36px;">Recent rooms</div>
      <div id="my-rooms"><div class="spinner"></div></div>
    </div>`;

  try {
    const data = await API.auth.me();
    const s = data.user.stats || {};
    document.getElementById('st-created').textContent = s.quizzesCreated || 0;
    document.getElementById('st-played').textContent  = s.gamesPlayed    || 0;
    document.getElementById('st-score').textContent   = s.totalScore     || 0;
    const acc = s.totalAnswers ? Math.round((s.correctAnswers / s.totalAnswers) * 100) : 0;
    document.getElementById('st-acc').textContent = acc + '%';
  } catch {}

  try {
    const data = await API.quiz.mine();
    const el = document.getElementById('my-quizzes');
    if (!data.quizzes.length) {
      el.innerHTML = `<div class="empty-state"><h3>No quizzes yet</h3><p>Create your first quiz to get started</p><br><a href="/quiz/new" class="btn-primary" data-link>+ Create quiz</a></div>`;
    } else {
      el.innerHTML = `<div class="quiz-grid">${data.quizzes.map(q => `
        <div class="quiz-card">
          <div class="quiz-card-cover">${TOPIC_ICONS[q.topic]||'🎯'}</div>
          <div class="quiz-card-body">
            <div class="quiz-card-title">${escapeHtml(q.title)}</div>
            <div class="quiz-card-meta">
              <span class="badge badge-topic">${q.topic}</span>
              <span class="badge badge-${q.difficulty}">${q.difficulty}</span>
              <span class="badge badge-count">${q.questions?.length||0} Qs</span>
              ${q.isPublic ? '<span class="badge" style="background:rgba(0,229,160,0.1);color:var(--green);">Public</span>' : '<span class="badge">Private</span>'}
            </div>
            <div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap;">
              <button class="btn-primary" style="padding:7px 14px;font-size:13px;" onclick="hostQuiz('${q._id}')">▶ Host</button>
              <a href="/quiz/${q._id}/edit" class="btn-outline" data-link style="padding:7px 14px;font-size:13px;">Edit</a>
              <button class="btn-ghost" style="padding:7px 10px;font-size:13px;" onclick="duplicateQuiz('${q._id}')">⧉ Copy</button>
              <button class="btn-danger" style="padding:7px 10px;font-size:13px;" onclick="deleteQuiz('${q._id}',this)">✕</button>
            </div>
          </div>
        </div>`).join('')}</div>`;
    }
  } catch (err) {
    document.getElementById('my-quizzes').innerHTML = `<div class="empty-state"><h3>${err.message}</h3></div>`;
  }

  try {
    const data = await API.room.my();
    const el = document.getElementById('my-rooms');
    if (!data.rooms.length) {
      el.innerHTML = `<div class="empty-state" style="padding:20px 0;"><p>No rooms yet — host a quiz to create one</p></div>`;
    } else {
      el.innerHTML = `<div style="display:flex;flex-direction:column;gap:8px;">${data.rooms.map(r => `
        <div class="card" style="display:flex;align-items:center;gap:16px;">
          <div style="font-family:'Syne',sans-serif;font-size:20px;font-weight:800;color:var(--accent);min-width:80px;">${r.code}</div>
          <div style="flex:1;">
            <div style="font-weight:500;">${escapeHtml(r.quiz?.title||'Unknown quiz')}</div>
            <div style="font-size:12px;color:var(--muted);">${r.players?.length||0} players · ${r.status} · ${new Date(r.createdAt).toLocaleDateString()}</div>
          </div>
          ${r.status==='finished' ? `<a href="/room/${r.code}/results" class="btn-outline" data-link style="padding:7px 14px;font-size:13px;">Results</a>` : `<button class="btn-primary" style="padding:7px 14px;font-size:13px;" onclick="Router.navigate('/room/${r.code}/host')">Rejoin</button>`}
        </div>`).join('')}</div>`;
    }
  } catch {}
}

async function hostQuiz(quizId) {
  try {
    const data = await API.room.create({ quizId });
    Router.navigate(`/room/${data.room.code}/host`);
  } catch (err) { Toast.error(err.message); }
}

async function deleteQuiz(id, btn) {
  if (!confirm('Delete this quiz? This cannot be undone.')) return;
  btn.disabled = true;
  try {
    await API.quiz.delete(id);
    Toast.success('Quiz deleted');
    renderDashboard();
  } catch (err) { Toast.error(err.message); btn.disabled = false; }
}

async function duplicateQuiz(id) {
  try {
    await API.quiz.duplicate(id);
    Toast.success('Quiz duplicated');
    renderDashboard();
  } catch (err) { Toast.error(err.message); }
}
