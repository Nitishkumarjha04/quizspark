function renderRoomJoin() {
  document.getElementById('view').innerHTML = `
    <div class="join-hero">
      <div class="join-card">
        <div style="font-size:40px;margin-bottom:16px;">🚀</div>
        <h1>Join a quiz room</h1>
        <p style="color:var(--muted);margin-bottom:28px;">Enter the 6-digit code from the host</p>
        <input id="join-code" class="code-input" placeholder="ABC123" maxlength="6" autocomplete="off" spellcheck="false">
        <div id="join-nickname-wrap" style="margin-top:14px;">
          <input id="join-nickname" class="form-input" placeholder="Your nickname (optional)" style="text-align:center;">
        </div>
        <button id="join-btn" class="btn-primary" style="width:100%;justify-content:center;margin-top:18px;padding:14px;">Join room →</button>
        <div id="join-error" class="form-error hidden" style="margin-top:10px;text-align:center;"></div>
      </div>
    </div>`;

  const codeEl = document.getElementById('join-code');
  const btn    = document.getElementById('join-btn');
  const errEl  = document.getElementById('join-error');

  codeEl.addEventListener('input', () => {
    codeEl.value = codeEl.value.toUpperCase().replace(/[^A-Z0-9]/g,'');
  });

  async function doJoin() {
    const code = codeEl.value.trim().toUpperCase();
    if (code.length < 6) { errEl.textContent = 'Enter a 6-character code'; errEl.classList.remove('hidden'); return; }
    errEl.classList.add('hidden');
    btn.disabled = true; btn.textContent = 'Joining…';

    try {
      const data = await API.room.get(code);
      if (data.room.status === 'finished') throw new Error('This game has already ended');
      const nickname = document.getElementById('join-nickname').value.trim() || undefined;
      Router.navigate(`/room/${code}/play${nickname?`?nick=${encodeURIComponent(nickname)}`:''}`);
    } catch (err) {
      errEl.textContent = err.message;
      errEl.classList.remove('hidden');
      btn.disabled = false; btn.textContent = 'Join room →';
    }
  }

  btn.addEventListener('click', doJoin);
  codeEl.addEventListener('keydown', e => e.key === 'Enter' && doJoin());
}
