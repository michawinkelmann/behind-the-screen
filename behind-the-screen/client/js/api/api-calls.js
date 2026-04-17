// REST API wrapper
window.API = {
  async _fetch(url, options = {}) {
    const token = AppState.get('token');
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (token) headers['X-Session-Token'] = token;
    if (AppState.get('isAdmin')) headers['X-Admin-Token'] = AppState.get('adminPassword') || '';

    const res = await fetch(url, { ...options, headers });

    let data;
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      data = await res.json().catch(() => ({}));
    } else {
      data = { error: await res.text().catch(() => 'Unerwartete Server-Antwort') };
    }

    // Expired/unknown session - drop client state and return to login.
    if (res.status === 401 && !url.includes('/api/auth/')) {
      if (window.AppState) AppState.clear();
      location.reload();
      throw new Error(data.error || 'Sitzung abgelaufen');
    }

    if (!res.ok) throw new Error(data.error || 'Anfrage fehlgeschlagen');
    return data;
  },

  // Auth
  async register(name, password, primarySpur) {
    return this._fetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, password, primarySpur })
    });
  },

  async login(name, password) {
    return this._fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ name, password })
    });
  },

  async adminLogin(password) {
    return this._fetch('/api/auth/admin-login', {
      method: 'POST',
      body: JSON.stringify({ password })
    });
  },

  async me() {
    return this._fetch('/api/auth/me');
  },

  async logout() {
    return this._fetch('/api/auth/logout', { method: 'POST' }).catch(() => null);
  },

  // Evidence
  async searchEvidence(params = {}) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v) qs.set(k, v); });
    return this._fetch('/api/evidence/search?' + qs.toString());
  },

  async getEvidence(id) {
    return this._fetch('/api/evidence/' + encodeURIComponent(id));
  },

  async discoverEvidence(id) {
    return this._fetch('/api/evidence/' + encodeURIComponent(id) + '/discover', { method: 'POST' });
  },

  async getEvidenceStats() {
    return this._fetch('/api/evidence/stats');
  },

  async getEvidenceFilters() {
    return this._fetch('/api/evidence/filters');
  },

  // Board
  async getBoardNotes(column) {
    const qs = column ? '?column=' + encodeURIComponent(column) : '';
    return this._fetch('/api/board/notes' + qs);
  },

  async createBoardNote(data) {
    return this._fetch('/api/board/notes', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async updateBoardNote(id, data) {
    return this._fetch('/api/board/notes/' + id, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async deleteBoardNote(id) {
    return this._fetch('/api/board/notes/' + id, { method: 'DELETE' });
  },

  async addBoardComment(noteId, content) {
    return this._fetch('/api/board/notes/' + noteId + '/comment', {
      method: 'POST',
      body: JSON.stringify({ content })
    });
  },

  // Modules
  async getModules() {
    return this._fetch('/api/modules');
  },

  async getModule(id) {
    return this._fetch('/api/modules/' + encodeURIComponent(id));
  },

  async completeModule(id) {
    return this._fetch('/api/modules/' + encodeURIComponent(id) + '/complete', { method: 'POST' });
  },

  // Game State
  async getGameState() {
    return fetch('/api/game/state').then(r => r.json());
  },

  // Admin
  async getAdminState() {
    return this._fetch('/api/admin/gamestate');
  },

  async adminPause(message) {
    return this._fetch('/api/admin/pause', {
      method: 'POST',
      body: JSON.stringify({ message })
    });
  },

  async adminResume() {
    return this._fetch('/api/admin/resume', { method: 'POST' });
  },

  async adminAdvancePhase() {
    return this._fetch('/api/admin/advance-phase', { method: 'POST' });
  },

  async adminSetDay(day) {
    return this._fetch('/api/admin/set-day', {
      method: 'POST',
      body: JSON.stringify({ day })
    });
  },

  async adminBroadcast(message) {
    return this._fetch('/api/admin/broadcast', {
      method: 'POST',
      body: JSON.stringify({ message })
    });
  },

  async adminClearBroadcast() {
    return this._fetch('/api/admin/clear-broadcast', { method: 'POST' });
  },

  async adminSetDuration(minutes) {
    return this._fetch('/api/admin/set-duration', {
      method: 'POST',
      body: JSON.stringify({ minutes })
    });
  },

  async adminGetActivity() {
    return this._fetch('/api/admin/activity');
  },

  async adminExport() {
    return this._fetch('/api/admin/export');
  },

  async adminReset() {
    return this._fetch('/api/admin/reset', { method: 'POST' });
  }
};
