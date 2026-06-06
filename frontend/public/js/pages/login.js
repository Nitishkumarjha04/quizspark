function renderLogin() {
  document.getElementById('view').innerHTML = `
    <div class="auth-page">
      <div class="auth-card">
        <h1 class="auth-title">Welcome back</h1>
        <p class="auth-sub">Log in to create and host quizzes</p>
        <div id="login-error" class="form-error hidden" style="margin-bottom:14px;padding:10px 14px;background:rgba(255,79,110,0.1);border-radius:8px;"></div>
        <div class="form-group">
          <label class="form-label">Email</label>
          <input id="login-email" class="form-input" type="email" placeholder="you@example.com" autocomplete="email">
        </div>
        <div class="form-group">
  <label class="form-label">Password</label>

  <div style="position:relative;">
    <input
      id="login-password"
      class="form-input"
      type="password"
      placeholder="••••••••"
      autocomplete="current-password"
      style="padding-right:50px;"
     >

      <button
      type="button"
      id="toggle-login-password"
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
        <button id="login-btn" class="btn-primary" style="width:100%;justify-content:center;margin-top:4px;">Log in</button>
        <div class="auth-footer">
          Don't have an account? <a href="/register" data-link>Sign up</a>
        </div>
      </div>
    </div>`;

  const emailEl = document.getElementById('login-email');
  const passEl  = document.getElementById('login-password');
  const btn     = document.getElementById('login-btn');
  const errEl   = document.getElementById('login-error');
  const togglePassBtn = document.getElementById('toggle-login-password');

     togglePassBtn.addEventListener('click', () => {

   if (passEl.type === 'password') {
    passEl.type = 'text';
    togglePassBtn.textContent = '🙈';
   } else {
    passEl.type = 'password';
    togglePassBtn.textContent = '👁';
   }
  
    });

  async function doLogin() {
    errEl.classList.add('hidden');
    btn.disabled = true;
    btn.textContent = 'Logging in…';
    try {
      const data = await API.auth.login({ email: emailEl.value.trim(), password: passEl.value });
      Auth.setSession(data.token, data.user);
      Toast.success(`Welcome back, ${data.user.username}!`);
      Router.navigate('/dashboard');
    } catch (err) {
      errEl.textContent = err.message;
      errEl.classList.remove('hidden');
      btn.disabled = false;
      btn.textContent = 'Log in';
    }
  }

  btn.addEventListener('click', doLogin);
  [emailEl, passEl].forEach(el => el.addEventListener('keydown', e => e.key === 'Enter' && doLogin()));
}
