// Central state store with event emitter
window.AppState = {
  _state: {
    team: null,
    token: null,
    adminPassword: null,
    isAdmin: false,
    currentScreen: 'investigation',
    gameState: null,
    evidenceCache: {},
    spurStats: [],
    boardNotes: [],
    chatMessages: [],
    chatUnread: 0
  },

  _listeners: {},

  get(key) {
    return this._state[key];
  },

  set(key, value) {
    const old = this._state[key];
    this._state[key] = value;
    this._emit(key, value, old);
  },

  on(key, fn) {
    if (!this._listeners[key]) this._listeners[key] = [];
    this._listeners[key].push(fn);
  },

  off(key, fn) {
    if (!this._listeners[key]) return;
    this._listeners[key] = this._listeners[key].filter(f => f !== fn);
  },

  _emit(key, value, old) {
    if (this._listeners[key]) {
      this._listeners[key].forEach(fn => fn(value, old));
    }
  },

  // Persistence helpers
  save() {
    const data = {
      token: this._state.token,
      team: this._state.team,
      isAdmin: this._state.isAdmin,
      adminPassword: this._state.adminPassword
    };
    localStorage.setItem('bts_session', JSON.stringify(data));
  },

  load() {
    try {
      const data = JSON.parse(localStorage.getItem('bts_session'));
      if (data && data.token) {
        this._state.token = data.token;
        this._state.team = data.team;
        this._state.isAdmin = data.isAdmin || false;
        this._state.adminPassword = data.adminPassword || null;
        return true;
      }
    } catch (e) {}
    return false;
  },

  clear() {
    localStorage.removeItem('bts_session');
    this._state.token = null;
    this._state.team = null;
    this._state.isAdmin = false;
    this._state.adminPassword = null;
  },

  // Helper: get spur display name
  getSpurName(spur) {
    const names = {
      'gamer': 'Der Gamer',
      'creator': 'Der Creator',
      'discord': 'Discord-Mitglied',
      'social-media': 'Social Media',
      'algorithmus': 'Algorithmus'
    };
    return names[spur] || spur;
  },

  getSpurColor(spur) {
    const colors = {
      'gamer': '#9b59b6',
      'creator': '#e74c3c',
      'discord': '#5865F2',
      'social-media': '#e91e63',
      'algorithmus': '#ff9500'
    };
    return colors[spur] || '#8899a6';
  },

  getTypeLabel(type) {
    const labels = {
      'chat_protocol': 'Chat-Protokoll',
      'profile': 'Profil',
      'social_media_post': 'Social-Media-Post',
      'video': 'Video/Stream',
      'algorithm_data': 'Algorithmus-Daten',
      'analytics': 'Analytics',
      'connection': 'Verbindung',
      'document': 'Dokument'
    };
    return labels[type] || type;
  }
};
