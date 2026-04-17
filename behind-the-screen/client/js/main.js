// Main application entry point
(function() {
  let phaseTimerInterval = null;

  // Init socket
  SocketClient.init();

  // Check for existing session and try to restore it.
  // Sessions live in server memory and may be lost on restart - so we always
  // try to re-authenticate via cached credentials instead of trusting the token
  // blindly.
  if (AppState.load()) {
    bootstrapExistingSession();
  }

  async function bootstrapExistingSession() {
    try {
      if (AppState.get('isAdmin') && AppState.get('adminPassword')) {
        const { token } = await API.adminLogin(AppState.get('adminPassword'));
        AppState.set('token', token);
        AppState.save();
        SocketClient.authenticate(token);
        showApp();
        return;
      }

      // Team session - verify server still knows us
      try {
        const { team } = await API.me();
        AppState.set('team', team);
        AppState.save();
        SocketClient.authenticate(AppState.get('token'));
        showApp();
      } catch (e) {
        // Token no longer valid - drop and show login
        AppState.clear();
      }
    } catch (e) {
      AppState.clear();
      location.reload();
    }
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
      const input = document.getElementById('chat-input');
      if (input) input.focus();
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
    SocketClient.sendChat(msg.slice(0, 500));
    input.value = '';
  }

  // Chat messages listener
  AppState.on('chatMessages', renderChatMessages);
  AppState.on('chatUnread', updateChatUnread);
  AppState.on('gameState', updateNavInfo);

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
      badge.textContent = count > 99 ? '99+' : String(count);
      badge.style.display = '';
    } else {
      badge.style.display = 'none';
    }
  }

  function scrollChatToBottom() {
    const container = document.getElementById('chat-messages');
    if (container) container.scrollTop = container.scrollHeight;
  }

  // Show main app, hide login
  function showApp() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('main-app').classList.remove('hidden');

    const team = AppState.get('team');
    const isAdmin = AppState.get('isAdmin');

    document.getElementById('nav-team-name').textContent = team ? team.name : '';
    document.getElementById('nav-team-spur').textContent = team ? AppState.getSpurName(team.primary_spur) : '';
    document.getElementById('nav-admin-link').style.display = isAdmin ? '' : 'none';
    document.getElementById('chat-panel').style.display = isAdmin ? 'none' : '';

    ensureLogoutButton();

    loadGameState();
    ScreenManager.init();

    if (isAdmin) window.location.hash = '#/admin';
  }

  function ensureLogoutButton() {
    const actions = document.querySelector('.top-nav-actions');
    if (!actions || document.getElementById('nav-logout')) return;
    const btn = document.createElement('a');
    btn.id = 'nav-logout';
    btn.href = '#';
    btn.className = 'nav-link';
    btn.textContent = 'Abmelden';
    btn.style.marginLeft = '0.5rem';
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      if (!confirm('Wirklich abmelden?')) return;
      try { await API.logout(); } catch (_) {}
      AppState.clear();
      location.reload();
    });
    actions.appendChild(btn);
  }

  async function loadGameState() {
    try {
      const state = await API.getGameState();
      AppState.set('gameState', state);
      if (state && state.teacher_message) {
        if (window.showBroadcastBanner) showBroadcastBanner(state.teacher_message);
      }
      if (state && state.is_paused && !AppState.get('isAdmin')) {
        const overlay = document.getElementById('pause-overlay');
        if (overlay) overlay.classList.add('visible');
      }
      updateNavInfo();
    } catch (e) { /* silent */ }
  }

  // Exposed for socket events
  window.updateNavInfo = function() {
    const state = AppState.get('gameState');
    if (!state) return;

    const phaseNames = { 1: 'Ermittlung', 2: 'Verknuepfungen', 3: 'Synthese' };
    document.getElementById('nav-day').textContent = state.current_day || 1;
    document.getElementById('nav-phase').textContent = phaseNames[state.current_phase] || state.current_phase;

    // Phase timer
    const timerContainer = document.getElementById('nav-timer-container');
    const timerLabel = document.getElementById('nav-timer');
    if (!timerContainer || !timerLabel) return;

    if (phaseTimerInterval) {
      clearInterval(phaseTimerInterval);
      phaseTimerInterval = null;
    }

    if (!state.phase_start_time || !state.phase_duration_minutes) {
      timerContainer.style.display = 'none';
      return;
    }

    const startedAt = new Date(state.phase_start_time).getTime();
    if (Number.isNaN(startedAt)) {
      timerContainer.style.display = 'none';
      return;
    }
    const endAt = startedAt + state.phase_duration_minutes * 60_000;

    const updateLabel = () => {
      if (state.is_paused || AppState.get('gameState') !== state && AppState.get('gameState') && AppState.get('gameState').is_paused) {
        // paused - keep showing current text, but don't tick down
      }
      const now = Date.now();
      const ms = Math.max(0, endAt - now);
      const mins = Math.floor(ms / 60000);
      const secs = Math.floor((ms % 60000) / 1000);
      timerLabel.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      timerContainer.style.color = ms < 60000 ? 'var(--warning)' : '';
    };

    timerContainer.style.display = '';
    updateLabel();
    phaseTimerInterval = setInterval(() => {
      const cur = AppState.get('gameState');
      if (cur && cur.is_paused) return;
      updateLabel();
    }, 1000);
  };

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }
})();
