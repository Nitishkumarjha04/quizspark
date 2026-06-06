function renderRegister() {
  document.getElementById('view').innerHTML = `
    <div class="auth-page">
      <div class="auth-card">
        <h1 class="auth-title">Create account</h1>
        <p class="auth-sub">Join QuizSpark and start hosting live quizzes</p>
        <div id="reg-error" class="form-error hidden" style="margin-bottom:14px;padding:10px 14px;background:rgba(255,79,110,0.1);border-radius:8px;"></div>
        <div class="form-group">
          <label class="form-label">Username</label>
          <input id="reg-username" class="form-input" type="text" placeholder="coolquizmaster" autocomplete="username">
        </div>
        <div class="form-group">
          <label class="form-label">Email</label>
          <input id="reg-email" class="form-input" type="email" placeholder="you@example.com" autocomplete="email">
        </div>
        <div class="form-group">
  <label class="form-label">Password</label>

  <div style="position:relative;">
    <input
      id="reg-password"
      class="form-input"
      type="password"
      placeholder="Min 6 characters"
      autocomplete="new-password"
      style="padding-right:50px;"
    >

    <button
      type="button"
      id="toggle-reg-password"
      style="
        position:absolute;
        right:12px;
        top:50%;
        transform:translateY(-50%);
        background:none;
        border:none;
        cursor:pointer;
        color:var(--muted);
        font-size:18px;
       "
       >
        👁
       </button>
       </div>
        </div>
        <button id="reg-btn" class="btn-primary" style="width:100%;justify-content:center;margin-top:4px;">Create account</button>
        <div class="auth-footer">Already have an account? <a href="/login" data-link>Log in</a></div>
      </div>
    </div>`;

   const btn   = document.getElementById('reg-btn');
    const errEl = document.getElementById('reg-error');

     const regPassEl = document.getElementById('reg-password');
     const toggleRegPassBtn = document.getElementById('toggle-reg-password');

     toggleRegPassBtn.addEventListener('click', () => {

      if (regPassEl.type === 'password') {
     regPassEl.type = 'text';
      toggleRegPassBtn.textContent = '🙈';
     } else {
     regPassEl.type = 'password';
     toggleRegPassBtn.textContent = '👁';
  }

});

  async function doRegister() {
    errEl.classList.add('hidden');
    const username = document.getElementById('reg-username').value.trim();
    const email    = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;

    if (username.length < 3) { errEl.textContent = 'Username must be at least 3 characters'; errEl.classList.remove('hidden'); return; }
    if (password.length < 6) { errEl.textContent = 'Password must be at least 6 characters'; errEl.classList.remove('hidden'); return; }

    btn.disabled = true; btn.textContent = 'Creating account…';
    try {
      const data = await API.auth.register({ username, email, password });
      Auth.setSession(data.token, data.user);
      Toast.success(`Welcome to QuizSpark, ${data.user.username}!`);
      Router.navigate('/dashboard');
    } catch (err) {
      errEl.textContent = err.message;
      errEl.classList.remove('hidden');
      btn.disabled = false; btn.textContent = 'Create account';
    }
  }

  btn.addEventListener('click', doRegister);
  document.getElementById('reg-password').addEventListener('keydown', e => e.key === 'Enter' && doRegister());
}
