async function renderResults({ code }) {
  document.getElementById('view').innerHTML = '<div class="spinner"></div>';
  try {
    const data = await API.room.results(code);
    const { leaderboard, room } = data;
    const top = leaderboard[0];

    document.getElementById('view').innerHTML = `
      <div class="page-sm">
        <div class="results-hero">
          <span class="results-emoji">🏆</span>
          <h1 class="results-title">${escapeHtml(room.quiz?.title||'Quiz')} — Results</h1>
          <p class="results-sub">${leaderboard.length} players · ${new Date(room.finishedAt).toLocaleDateString()}</p>
        </div>

        ${top ? `
        <div class="card" style="text-align:center;margin-bottom:24px;border-color:rgba(255,215,0,0.3);">
          <div style="font-size:32px;margin-bottom:8px;">🥇</div>
          <div style="font-family:'Syne',sans-serif;font-size:22px;font-weight:800;">${escapeHtml(top.nickname)}</div>
          <div style="font-size:28px;font-weight:700;color:var(--accent);margin-top:4px;">${top.score.toLocaleString()} pts</div>
        </div>` : ''}

        <div class="section-title">Full leaderboard</div>
        <div class="leaderboard" style="margin-bottom:28px;">
          ${leaderboard.map((p, i) => `
            <div class="lb-row">
              <div class="lb-rank ${i===0?'gold':i===1?'silver':i===2?'bronze':''}">${['🥇','🥈','🥉'][i]||p.rank}</div>
              <div class="player-avatar-sm">${(p.nickname||'?')[0].toUpperCase()}</div>
              <div class="lb-name">${escapeHtml(p.nickname)}</div>
              <div style="font-size:12px;color:var(--muted);">${p.answers?.filter(a=>a.correct).length||0}/${p.answers?.length||0} correct</div>
              <div class="lb-score">${p.score.toLocaleString()}</div>
            </div>`).join('')}
        </div>

        <div class="btn-row" style="justify-content:center;">
          <a href="/dashboard" class="btn-outline" data-link>Dashboard</a>
          <a href="/explore" class="btn-primary" data-link>Play more quizzes</a>
        </div>
      </div>`;
  } catch (err) {
    document.getElementById('view').innerHTML = `<div class="page"><div class="empty-state"><h3>${err.message}</h3><br><a href="/" class="btn-primary" data-link>Go home</a></div></div>`;
  }
}
