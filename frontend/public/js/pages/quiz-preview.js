async function renderQuizPreview({ id }) {
  document.getElementById('view').innerHTML = '<div class="spinner"></div>';
  try {
    const data = await API.quiz.get(id);
    const q = data.quiz;
    const user = Auth.getUser();
    const isOwner = user && q.creator?._id === user._id;

    document.getElementById('view').innerHTML = `
      <div class="page-sm">
        <div style="display:flex;gap:10px;margin-bottom:24px;flex-wrap:wrap;">
          <a href="/explore" class="btn-ghost" data-link>← Back</a>
         ${isOwner ? `
<a href="/quiz/${id}/edit" class="btn-outline" data-link>Edit</a>

<button class="btn-primary"
        onclick="hostQuiz('${id}')">
  ▶ Host live
</button>
` : ''}

<a href="/quiz/${id}/play"
   class="btn-outline"
   data-link>
   📝 Practice Quiz
</a>
        </div>
        <div style="text-align:center;margin-bottom:32px;">
          <div style="font-size:52px;margin-bottom:12px;">${TOPIC_ICONS[q.topic]||'🎯'}</div>
          <h1 style="font-family:'Syne',sans-serif;font-size:28px;font-weight:800;margin-bottom:8px;">${escapeHtml(q.title)}</h1>
          ${q.description ? `<p style="color:var(--muted);">${escapeHtml(q.description)}</p>` : ''}
          <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:14px;">
            <span class="badge badge-topic">${q.topic}</span>
            <span class="badge badge-${q.difficulty}">${q.difficulty}</span>
            <span class="badge badge-count">${q.questions.length} questions</span>
            <span class="badge badge-count">${q.playCount} plays</span>
          </div>
          <div style="margin-top:10px;font-size:13px;color:var(--muted);">by ${escapeHtml(q.creator?.username||'Anonymous')}</div>
        </div>

        <div class="section-title">Questions preview</div>
        <div style="display:flex;flex-direction:column;gap:10px;">
          ${q.questions.map((qu,i) => `
            <div class="card">
              <div style="font-weight:500;margin-bottom:10px;">${i+1}. ${escapeHtml(qu.text)}</div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                ${qu.options.map((o,oi) => `
                  <div style="padding:8px 12px;border-radius:8px;font-size:13px;border:1px solid ${oi===qu.correctIndex?'rgba(0,229,160,0.4)':'var(--border)'};background:${oi===qu.correctIndex?'rgba(0,229,160,0.08)':'var(--surface2)'};">
                    ${oi===qu.correctIndex?'✓ ':''}<span style="color:var(--muted);font-size:11px;">${['A','B','C','D','E','F'][oi]}.</span> ${escapeHtml(o)}
                  </div>`).join('')}
              </div>
              <div style="margin-top:8px;font-size:12px;color:var(--muted);">⏱ ${qu.timeLimit}s · ${qu.points}pts</div>
            </div>`).join('')}
        </div>
      </div>`;
  } catch (err) {
    document.getElementById('view').innerHTML = `<div class="page"><div class="empty-state"><h3>${err.message}</h3></div></div>`;
  }
}
