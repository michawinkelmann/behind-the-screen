// Socket.IO client setup
window.SocketClient = {
  socket: null,
  connected: false,

  init() {
    this.socket = io({ transports: ['websocket', 'polling'] });

    this.socket.on('connect', () => {
      this.connected = true;
      // Authenticate if we have a token
      const token = AppState.get('token');
      if (token) {
        this.socket.emit('auth', { token });
      }
    });

    this.socket.on('disconnect', () => {
      this.connected = false;
      this._showReconnectBanner(true);
      Notifications.show('Verbindung verloren - versuche erneut...', 'warning');
    });

    this.socket.on('reconnect', () => {
      this.connected = true;
      this._showReconnectBanner(false);
      const token = AppState.get('token');
      if (token) this.socket.emit('auth', { token });
      Notifications.show('Verbindung wiederhergestellt', 'success');
    });

    this.socket.on('auth:success', ({ team }) => {
      console.log('Socket authenticated as', team.name);
    });

    // Board events
    this.socket.on('board:note-added', (note) => {
      const notes = AppState.get('boardNotes') || [];
      notes.unshift(note);
      AppState.set('boardNotes', [...notes]);
      if (note.team_id !== (AppState.get('team') || {}).id) {
        Notifications.show(`${note.team_name} hat eine neue Notiz gepinnt: "${note.title}"`, 'info');
      }
    });

    this.socket.on('board:note-updated', (note) => {
      const notes = AppState.get('boardNotes') || [];
      const idx = notes.findIndex(n => n.id === note.id);
      if (idx >= 0) notes[idx] = note;
      AppState.set('boardNotes', [...notes]);
    });

    this.socket.on('board:note-deleted', ({ id }) => {
      const notes = (AppState.get('boardNotes') || []).filter(n => n.id !== id);
      AppState.set('boardNotes', notes);
    });

    this.socket.on('board:comment-added', ({ noteId, comment }) => {
      const notes = AppState.get('boardNotes') || [];
      const note = notes.find(n => n.id === noteId);
      if (note) {
        if (!note.comments) note.comments = [];
        note.comments.push(comment);
        AppState.set('boardNotes', [...notes]);
      }
    });

    // Evidence events
    this.socket.on('evidence:discovered', ({ teamName, title, importance }) => {
      if (importance >= 4) {
        Notifications.show(`${teamName} hat wichtigen Beweis gefunden: "${title}"`, 'success');
      }
    });

    // Game events
    this.socket.on('game:paused', ({ message }) => {
      const overlay = document.getElementById('pause-overlay');
      const msg = document.getElementById('pause-message');
      if (overlay) { overlay.classList.add('visible'); }
      if (msg) { msg.textContent = message || 'Die Lehrkraft hat das Spiel pausiert.'; }
    });

    this.socket.on('game:resumed', () => {
      const overlay = document.getElementById('pause-overlay');
      if (overlay) { overlay.classList.remove('visible'); }
    });

    this.socket.on('game:phase-changed', ({ gameState }) => {
      AppState.set('gameState', gameState);
      Notifications.show(`Neuer Abschnitt: Tag ${gameState.current_day}, Phase ${gameState.current_phase}`, 'info');
      updateNavInfo();
    });

    this.socket.on('game:reset', () => {
      Notifications.show('Spiel wurde zurueckgesetzt', 'warning');
      location.reload();
    });

    // Admin broadcast
    this.socket.on('admin:broadcast', ({ message }) => {
      const banner = document.getElementById('broadcast-banner');
      const text = document.getElementById('broadcast-text');
      if (banner && text) {
        text.textContent = message;
        banner.classList.add('visible');
      }
      Notifications.show('Nachricht der Lehrkraft: ' + message, 'info');
    });

    // Chat
    this.socket.on('chat:message', (msg) => {
      const messages = AppState.get('chatMessages') || [];
      messages.push(msg);
      if (messages.length > 200) messages.shift();
      AppState.set('chatMessages', [...messages]);

      const chatBody = document.getElementById('chat-body');
      if (chatBody && chatBody.classList.contains('hidden')) {
        AppState.set('chatUnread', (AppState.get('chatUnread') || 0) + 1);
      }
    });

    // Team online/offline
    this.socket.on('team:online', ({ teamName }) => {
      Notifications.show(`${teamName} ist jetzt online`, 'info');
    });
  },

  authenticate(token) {
    if (this.socket && this.connected) {
      this.socket.emit('auth', { token });
    }
  },

  sendChat(message) {
    if (this.socket) this.socket.emit('chat:send', { message });
  },

  discoverEvidence(evidenceId) {
    if (this.socket) this.socket.emit('evidence:discover', { evidenceId });
  },

  _showReconnectBanner(show) {
    let banner = document.getElementById('reconnect-banner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'reconnect-banner';
      banner.style.cssText = 'position:fixed; top:0; left:0; right:0; z-index:10000; background:var(--warning); color:#000; text-align:center; padding:0.4rem; font-size:0.85rem; font-weight:600; transition:transform 0.3s; transform:translateY(-100%);';
      banner.textContent = 'Verbindung zum Server verloren - Versuche erneut zu verbinden...';
      document.body.appendChild(banner);
    }
    banner.style.transform = show ? 'translateY(0)' : 'translateY(-100%)';
  }
};
