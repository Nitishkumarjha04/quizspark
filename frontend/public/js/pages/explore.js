const TOPIC_ICONS = { coding:'💻', science:'🔬', history:'🏛️', math:'📐', geography:'🌍', sports:'⚽', music:'🎵', general:'🎯', custom:'✨' };

async function renderExplore() {
  document.getElementById('view').innerHTML = `
    <div class="page">
      <div class="page-header">
        <div><h1 class="page-title">Explore quizzes</h1><p class="page-sub">Discover and play public quizzes from the community</p></div>
      </div>
      <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:28px;align-items:center;">
        <input id="search-input" class="form-input" placeholder="Search quizzes…" style="max-width:280px;">
        <select id="topic-filter" class="form-select" style="max-width:160px;">
          <option value="">All topics</option>
          ${Object.keys(TOPIC_ICONS).map(t => `<option value="${t}">${TOPIC_ICONS[t]} ${t.charAt(0).toUpperCase()+t.slice(1)}</option>`).join('')}
        </select>
        <select id="diff-filter" class="form-select" style="max-width:140px;">
          <option value="">Any difficulty</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>
      <div id="quiz-list"><div class="spinner"></div></div>
      <div id="pagination" style="display:flex;justify-content:center;gap:10px;margin-top:28px;"></div>
    </div>`;

  let page = 1;

  async function load() {
    const search = document.getElementById('search-input').value;
    const topic  = document.getElementById('topic-filter').value;
    const diff   = document.getElementById('diff-filter').value;
    const qs = new URLSearchParams({ page, limit: 12 });
    if (search) qs.set('search', search);
    if (topic)  qs.set('topic', topic);
    if (diff)   qs.set('difficulty', diff);

    const listEl = document.getElementById('quiz-list');
    listEl.innerHTML = '<div class="spinner"></div>';
    try {
      const data = await API.quiz.list(qs.toString());
      if (!data.quizzes.length) {
        listEl.innerHTML = `<div class="empty-state"><h3>No quizzes found</h3><p>Try a different search or topic</p></div>`;
      } else {
        listEl.innerHTML = `<div class="quiz-grid">${data.quizzes.map(renderQuizCard).join('')}</div>`;
      }
      renderPagination(data.page, data.pages);
    } catch (err) {
      listEl.innerHTML = `<div class="empty-state"><h3>Failed to load</h3><p>${err.message}</p></div>`;
    }
  }

  function renderPagination(cur, total) {
    const el = document.getElementById('pagination');
    if (total <= 1) { el.innerHTML = ''; return; }
    el.innerHTML = `
      <button class="btn-outline" ${cur===1?'disabled':''} id="pg-prev">← Prev</button>
      <span style="display:flex;align-items:center;color:var(--muted);font-size:14px;">Page ${cur} of ${total}</span>
      <button class="btn-outline" ${cur===total?'disabled':''} id="pg-next">Next →</button>`;
    document.getElementById('pg-prev')?.addEventListener('click', () => { page--; load(); });
    document.getElementById('pg-next')?.addEventListener('click', () => { page++; load(); });
  }

  let searchTimer;
  document.getElementById('search-input').addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => { page=1; load(); }, 400);
  });
  document.getElementById('topic-filter').addEventListener('change', () => { page=1; load(); });
  document.getElementById('diff-filter').addEventListener('change', () => { page=1; load(); });

  load();
}

function renderQuizCard(q) {
  const icon = TOPIC_ICONS[q.topic] || '🎯';
  return `
    <div class="quiz-card" data-href="/quiz/${q._id}" data-link onclick="Router.navigate('/quiz/${q._id}')">
      <div class="quiz-card-cover">${icon}</div>
      <div class="quiz-card-body">
        <div class="quiz-card-title">${escapeHtml(q.title)}</div>
        <div class="quiz-card-meta">
          <span class="badge badge-topic">${q.topic}</span>
          <span class="badge badge-${q.difficulty}">${q.difficulty}</span>
          <span class="badge badge-count">${q.questions?.length || 0} Qs</span>
        </div>
        <div style="margin-top:10px;font-size:12px;color:var(--muted);">by ${escapeHtml(q.creator?.username||'Anonymous')} · ${q.playCount||0} plays</div>
      </div>
    </div>`;
}

function escapeHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
