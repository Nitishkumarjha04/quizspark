function renderProfile() {

  const user = Auth.getUser();

  document.getElementById('view').innerHTML = `
    <div class="container" style="max-width:700px;margin:40px auto;">

      <div class="card" style="padding:24px;">

        <h1 style="margin-bottom:20px;">👤 My Profile</h1>

        <div class="form-group">
          <label class="form-label">Username</label>
          <input
            id="profile-username"
            class="form-input"
            value="${user?.username || ''}"
          >
        </div>

        <div class="form-group">
          <label class="form-label">Email</label>
          <input
            class="form-input"
            value="${user?.email || ''}"
            disabled
          >
        </div>

        <div class="form-group">
          <label class="form-label">Avatar URL</label>
          <input
            id="profile-avatar"
            class="form-input"
            value="${user?.avatar || ''}"
            placeholder="https://..."
          >
        </div>

        <button id="save-profile-btn" class="btn-primary">
          Save Changes
        </button>

      </div>

            <div class="card" style="padding:24px;margin-top:20px;">

        <h2>📊 Statistics</h2>

        <p>Quizzes Created: ${user?.stats?.quizzesCreated || 0}</p>
        <p>Games Played: ${user?.stats?.gamesPlayed || 0}</p>
        <p>Total Score: ${user?.stats?.totalScore || 0}</p>
        <p>Correct Answers: ${user?.stats?.correctAnswers || 0}</p>

      </div>

      <div class="card" style="padding:24px;margin-top:20px;">

        <h2>🔐 Change Password</h2>

        <div class="form-group">
          <label class="form-label">Current Password</label>
          <input id="current-password" class="form-input" type="password">
        </div>

        <div class="form-group">
          <label class="form-label">New Password</label>
          <input id="new-password" class="form-input" type="password">
        </div>

        <button id="change-password-btn" class="btn-primary">
          Update Password
        </button>

      </div>

    </div>
  `;
  

  document.getElementById('save-profile-btn')
    .addEventListener('click', async () => {

      try {

        const username =
          document.getElementById('profile-username').value.trim();

        const avatar =
          document.getElementById('profile-avatar').value.trim();

        const data = await API.patch('/auth/me', {
          username,
          avatar
        });

        Auth.setSession(
          Auth.getToken(),
          data.user
        );

        Toast.success('Profile updated');

      } catch (err) {

        Toast.error(err.message);

      }

    });
    document.getElementById('change-password-btn')
?.addEventListener('click', async () => {

  try {

    const currentPassword =
      document.getElementById('current-password').value;

    const newPassword =
      document.getElementById('new-password').value;

    await API.patch('/auth/change-password', {
      currentPassword,
      newPassword
    });

    Toast.success('Password updated successfully');

  } catch (err) {

    Toast.error(err.message);

  }

});

}