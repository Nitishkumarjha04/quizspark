const Auth = (() => {
  let _user = null;

  function getToken() { return localStorage.getItem('qs_token'); }
  function getUser()  { return _user; }
  function isLoggedIn() { return !!getToken() && !!_user; }

  function setSession(token, user) {
    localStorage.setItem('qs_token', token);
    _user = user;
    updateNavUI();
  }

  function clearSession() {
    localStorage.removeItem('qs_token');
    _user = null;
    updateNavUI();
  }

  async function restore() {
    const token = getToken();
    if (!token) { updateNavUI(); return false; }
    try {
      const data = await API.auth.me();
      _user = data.user;
      updateNavUI();
      return true;
    } catch {
      clearSession();
      return false;
    }
  }

  function updateNavUI() {
    const navbar = document.getElementById('navbar');
    const guestEl = document.getElementById('nav-guest');
    const userEl  = document.getElementById('nav-user');
    const nameEl  = document.getElementById('nav-username');
    const dashEl  = document.getElementById('nav-dashboard');
    if (!navbar) return;
    navbar.classList.remove('hidden');
    if (_user) {
      guestEl?.classList.add('hidden');
      userEl?.classList.remove('hidden');
      dashEl?.classList.remove('hidden');
      if (nameEl) nameEl.textContent = _user.username;
    } else {
      guestEl?.classList.remove('hidden');
      userEl?.classList.add('hidden');
      dashEl?.classList.add('hidden');
    }
  }

  return { getToken, getUser, isLoggedIn, setSession, clearSession, restore, updateNavUI };
})();
