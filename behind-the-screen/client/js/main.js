// Main application entry point
(function() {
  // Init socket
  SocketClient.init();

  // Check for existing session
  if (AppState.load()) {
    // Admin sessions live in server memory and don't survive a restart.
    // Re-login silently with the stored password so Pinnwand/REST stays authorized.
    if (AppState.get('isAdmin') && AppState.get('adminPassword')) {
      API.adminLogin(AppState.get('adminPassword'))
        .then(({ token }) => {
          AppState.set('token', token);
          AppState.save();
          SocketClient.authenticate(token);
        })
        .catch(() => { AppState.clear(); location.reload(); });
    } else {
      SocketClient.authenticate(AppState.get('token'));
    }
    showApp();
  }

  // Login tabs
  document.querySelectorAll('.login-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.login-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      document.getElementById('login-form').classList.add('hidden');
      document.getElementById('register-form').classList.add('hidden');
      document.getElementById('admin-login-form').classList.add('hidden');

      const target = tab.dataset.tab;
      if (target === 'login') document.getElementById('login-form').classList.remove('hidden');
      if (target === 'register') document.getElementById('register-form').classList.remove('hidden');
      if (target === 'admin') document.getElementById('admin-login-form').classList.remove('hidden');
    });
  });

  // Login form
  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('login-name').value.trim();
    const password = document.getElementById('login-password').value;
    const errorEl = document.getElementById('login-error');

    try {
      errorEl.textContent = '';
      const { team, token } = await API.login(name, password);
      AppState.set('team', team);
      AppState.set('token', token);
      AppState.set('isAdmin', false);
      AppState.save();
      SocketClient.authenticate(token);
      showApp();
    } catch (err) {
      errorEl.textContent = err.message;
    }
  });

  // Register form
  document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('register-name').value.trim();
    const password = document.getElementById('register-password').value;
    const spur = document.getElementById('register-spur').value;
    const errorEl = document.getElementById('register-error');

    try {
      errorEl.textContent = '';
      const { team, token } = await API.register(name, password, spur);
      AppState.set('team', team);
      AppState.set('token', token);
      AppState.set('isAdmin', false);
      AppState.save();
      SocketClient.authenticate(token);
      showApp();
    } catch (err) {
      errorEl.textContent = err.message;
    }
  });

  // Admin login form
  document.getElementById('admin-login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = document.getElementById('admin-password').value;
    const errorEl = document.getElementById('admin-error');

    try {
      errorEl.textContent = '';
      const { token } = await API.adminLogin(password);
      AppState.set('team', { id: 0, name: 'Admin' });
      AppState.set('token', token);
      AppState.set('adminPassword', password);
      AppState.set('isAdmin', true);
      AppState.save();
      SocketClient.authenticate(token);
      showApp();
    } catch (err) {
      errorEl.textContent = err.message;
    }
  });

  // Chat toggle
  document.getElementById('chat-toggle').addEventListener('click', () => {
    const body = document.getElementById('chat-body');
    body.classList.toggle('hidden');
    if (!body.classList.contains('hidden')) {
      AppState.set('chatUnread', 0);
      updateChatUnread();
      scrollChatToBottom();
    }
  });

  // Chat send
  document.getElementById('chat-send').addEventListener('click', sendChat);
  document.getElementById('chat-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendChat();
  });

  function sendChat() {
    const input = document.getElementById('chat-input');
    const msg = input.value.trim();
    if (!msg) return;
    SocketClient.sendChat(msg);
    input.value = '';
  }

  // Chat messages listener
  AppState.on('chatMessages', renderChatMessages);
  AppState.on('chatUnread', updateChatUnread);

  function renderChatMessages(messages) {
    const container = document.getElementById('chat-messages');
    const myTeamId = (AppState.get('team') || {}).id;

    container.innerHTML = messages.map(m => `
      <div style="padding:0.25rem 0; font-size:0.83rem;">
        <span style="font-weight:600; color:${m.teamId === myTeamId ? 'var(--accent)' : 'var(--info)'};">${escapeHTML(m.teamName)}</span>
        <span class="text-xs text-muted">${new Date(m.timestamp).toLocaleTimeString('de-DE', {hour:'2-digit', minute:'2-digit'})}</span>
        <div>${escapeHTML(m.message)}</div>
      </div>
    `).join('');

    scrollChatToBottom();
  }

  function updateChatUnread() {
    const count = AppState.get('chatUnread') || 0;
    const badge = document.getElementById('chat-unread');
    if (count > 0) {
      badge.textContent = count;
      badge.style.display = '';
    } else {
      badge.style.display = 'none';
    }
  }

  function scrollChatToBottom() {
    const container = document.getElementById('chat-messages');
    container.scrollTop = container.scrollHeight;
  }

  // Show main app, hide login
  function showApp() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('main-app').classList.remove('hidden');

    const team = AppState.get('team');
    const isAdmin = AppState.get('isAdmin');

    // Update nav
    document.getElementById('nav-team-name').textContent = team ? team.name : '';
    document.getElementById('nav-team-spur').textContent = team ? AppState.getSpurName(team.primary_spur) : '';

    // Show admin link if admin
    document.getElementById('nav-admin-link').style.display = isAdmin ? '' : 'none';

    // Hide chat for admin
    document.getElementById('chat-panel').style.display = isAdmin ? 'none' : '';

    // Load game state
    loadGameState();

    // Init screen manager
    ScreenManager.init();

    // If admin, go to admin screen
    if (isAdmin) {
      window.location.hash = '#/admin';
    }
  }

  async function loadGameState() {
    try {
      const state = await API.getGameState();
      AppState.set('gameState', state);
      updateNavInfo();
    } catch (e) {}
  }

  // Expose for socket events
  window.updateNavInfo = function() {
    const state = AppState.get('gameState');
    if (!state) return;

    const phaseNames = { 1: 'Ermittlung', 2: 'Verknuepfungen', 3: 'Synthese' };
    document.getElementById('nav-day').textContent = state.current_day || 1;
    document.getElementById('nav-phase').textContent = phaseNames[state.current_phase] || state.current_phase;
  };

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }
})();
