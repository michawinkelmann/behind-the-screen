// Admin panel for teacher
window.AdminPanel = {
  _initialized: false,
  _refreshInterval: null,

  async onShow() {
    if (!AppState.get('isAdmin')) {
      document.getElementById('admin-container').innerHTML = '<div class="text-muted" style="padding:2rem; text-align:center;">Kein Admin-Zugriff. Bitte als Admin anmelden.</div>';
      return;
    }
    this.render();
    await this.refresh();

    // Auto-refresh every 10s
    clearInterval(this._refreshInterval);
    this._refreshInterval = setInterval(() => {
      if (AppState.get('currentScreen') === 'admin') this.refresh();
    }, 10000);
  },

  render() {
    const container = document.getElementById('admin-container');
    container.innerHTML = `
      <!-- Connection Info -->
      <div class="admin-section">
        <h3>Verbindung</h3>
        <div id="admin-connection-info" class="text-sm">Lade...</div>
      </div>

      <!-- Game Controls -->
      <div class="admin-section">
        <h3>Spielsteuerung</h3>
        <div style="display:flex; gap:0.5rem; flex-wrap:wrap; margin-bottom:1rem;">
          <button class="btn btn-primary" id="admin-pause-btn">Pausieren</button>
          <button class="btn btn-secondary" id="admin-resume-btn">Fortsetzen</button>
          <button class="btn btn-secondary" id="admin-advance-btn">Naechste Phase</button>
        </div>
        <div style="display:flex; gap:0.5rem; align-items:center; margin-bottom:1rem;">
          <label class="text-sm">Tag:</label>
          <button class="btn btn-sm btn-secondary" data-set-day="1">Tag 1</button>
          <button class="btn btn-sm btn-secondary" data-set-day="2">Tag 2</button>
          <button class="btn btn-sm btn-secondary" data-set-day="3">Tag 3</button>
        </div>
        <div id="admin-game-state" class="text-sm text-muted"></div>
      </div>

      <!-- Broadcast -->
      <div class="admin-section">
        <h3>Nachricht senden</h3>
        <div style="display:flex; gap:0.5rem;">
          <input type="text" id="admin-broadcast-input" placeholder="Nachricht an alle Teams..." style="flex:1;">
          <button class="btn btn-primary" id="admin-broadcast-btn">Senden</button>
        </div>
      </div>

      <!-- Teams Overview -->
      <div class="admin-section">
        <h3>Teams</h3>
        <div id="admin-teams-list"></div>
      </div>

      <!-- Activity Log -->
      <div class="admin-section">
        <h3>Aktivitaet</h3>
        <div id="admin-activity-log" style="max-height:300px; overflow-y:auto;"></div>
      </div>

      <!-- Evidence Stats -->
      <div class="admin-section">
        <h3>Beweis-Statistik</h3>
        <div id="admin-evidence-stats"></div>
      </div>

      <!-- Danger Zone -->
      <div class="admin-section">
        <h3 style="color:var(--warning);">Gefahrenzone</h3>
        <button class="btn btn-danger" id="admin-reset-btn">Spiel zuruecksetzen</button>
        <button class="btn btn-secondary" id="admin-export-btn" style="margin-left:0.5rem;">Daten exportieren</button>
      </div>
    `;

    // Event handlers
    document.getElementById('admin-pause-btn').addEventListener('click', async () => {
      await API.adminPause('Reflexionspause');
      Notifications.show('Spiel pausiert', 'info');
      this.refresh();
    });

    document.getElementById('admin-resume-btn').addEventListener('click', async () => {
      await API.adminResume();
      Notifications.show('Spiel fortgesetzt', 'success');
      this.refresh();
    });

    document.getElementById('admin-advance-btn').addEventListener('click', async () => {
      await API.adminAdvancePhase();
      Notifications.show('Naechste Phase gestartet', 'success');
      this.refresh();
    });

    document.querySelectorAll('[data-set-day]').forEach(btn => {
      btn.addEventListener('click', async () => {
        await API.adminSetDay(parseInt(btn.dataset.setDay));
        Notifications.show('Tag ' + btn.dataset.setDay + ' gesetzt', 'success');
        this.refresh();
      });
    });

    document.getElementById('admin-broadcast-btn').addEventListener('click', async () => {
      const input = document.getElementById('admin-broadcast-input');
      const msg = input.value.trim();
      if (!msg) return;
      await API.adminBroadcast(msg);
      input.value = '';
      Notifications.show('Nachricht gesendet', 'success');
    });

    document.getElementById('admin-reset-btn').addEventListener('click', async () => {
      if (confirm('Spiel wirklich zuruecksetzen? Alle Fortschritte gehen verloren!')) {
        await API.adminReset();
        Notifications.show('Spiel zurueckgesetzt', 'warning');
        this.refresh();
      }
    });

    document.getElementById('admin-export-btn').addEventListener('click', async () => {
      const data = await API.adminExport();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'behind-the-screen-export.json';
      a.click();
      URL.revokeObjectURL(url);
      Notifications.show('Export heruntergeladen', 'success');
    });

    // Load connection info
    this.loadConnectionInfo();
  },

  async loadConnectionInfo() {
    try {
      const res = await fetch('/api/server-info');
      const info = await res.json();
      const el = document.getElementById('admin-connection-info');
      el.innerHTML = `
        <div style="display:flex; gap:1.5rem; align-items:flex-start; flex-wrap:wrap;">
          <div>
            <div style="font-weight:600; margin-bottom:0.5rem;">Server-URL fuer Schueler:</div>
            <div style="font-size:1.3rem; font-weight:700; color:var(--accent); font-family:monospace; padding:0.5rem; background:var(--bg-secondary); border-radius:6px;">
              ${info.url}
            </div>
            <div class="text-xs text-muted mt-1">Schueler geben diese URL im Browser ein (PC oder iPad)</div>
          </div>
          <div style="text-align:center;">
            <div style="font-weight:600; margin-bottom:0.5rem;">QR-Code:</div>
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(info.url)}"
                 alt="QR Code" style="border-radius:8px; background:#fff; padding:8px;" width="160" height="160"
                 onerror="this.parentElement.innerHTML='<div class=\\'text-muted text-sm\\'>QR-Code benoetigt Internet</div>'">
            <div class="text-xs text-muted mt-1">Scannen zum Verbinden</div>
          </div>
        </div>
      `;
    } catch (e) {
      document.getElementById('admin-connection-info').innerHTML = '<div class="text-muted">Server-Info nicht verfuegbar</div>';
    }
  },

  async refresh() {
    try {
      const { gameState, teams, evidenceStats } = await API.getAdminState();

      // Game State
      const phaseNames = { 1: 'Ermittlung', 2: 'Verknuepfungen', 3: 'Synthese' };
      document.getElementById('admin-game-state').innerHTML = `
        Tag ${gameState.current_day}/3 | Phase: ${phaseNames[gameState.current_phase] || gameState.current_phase}
        | Status: ${gameState.is_paused ? '<span style="color:var(--warning)">Pausiert</span>' : '<span style="color:var(--success)">Laeuft</span>'}
        ${gameState.teacher_message ? `<br>Aktuelle Nachricht: "${gameState.teacher_message}"` : ''}
      `;

      // Teams
      document.getElementById('admin-teams-list').innerHTML = teams.length === 0
        ? '<div class="text-muted">Noch keine Teams angemeldet.</div>'
        : teams.map(t => `
          <div class="card mb-1" style="padding:0.6rem;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <div>
                <strong>${this.escapeHTML(t.name)}</strong>
                <span class="badge badge-spur-${t.primary_spur}" style="margin-left:0.3rem;">${AppState.getSpurName(t.primary_spur)}</span>
              </div>
              <span class="text-xs text-muted">${t.last_active ? new Date(t.last_active).toLocaleTimeString('de-DE', {hour:'2-digit', minute:'2-digit'}) : '-'}</span>
            </div>
            <div class="text-xs text-muted mt-1">
              Beweise: ${t.evidence_found || 0} | Notizen: ${t.notes_created || 0} | Warnsignale: ${t.warnsignale_identified || 0}
            </div>
          </div>
        `).join('');

      // Evidence Stats
      const stats = evidenceStats;
      document.getElementById('admin-evidence-stats').innerHTML = `
        <div class="text-sm mb-1">Gesamt: ${stats.discovered}/${stats.total} entdeckt (${stats.total > 0 ? Math.round(stats.discovered/stats.total*100) : 0}%)</div>
        ${stats.bySpur.map(s => `
          <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.3rem;">
            <span class="badge badge-spur-${s.spur}" style="min-width:100px;">${AppState.getSpurName(s.spur)}</span>
            <div class="progress-bar" style="flex:1;">
              <div class="progress-bar-fill" style="width:${s.total > 0 ? Math.round(s.discovered/s.total*100) : 0}%; background:${AppState.getSpurColor(s.spur)};"></div>
            </div>
            <span class="text-xs text-muted">${s.discovered}/${s.total}</span>
          </div>
        `).join('')}
      `;

      // Activity
      const { recent } = await API.adminGetActivity();
      document.getElementById('admin-activity-log').innerHTML = recent.slice(0, 30).map(r => `
        <div style="font-size:0.78rem; padding:0.25rem 0; border-bottom:1px solid var(--border);">
          <span style="color:var(--accent);">${this.escapeHTML(r.team_name)}</span>
          <span class="text-muted">${r.action_type}</span>
          <span class="text-muted" style="float:right;">${new Date(r.timestamp).toLocaleTimeString('de-DE', {hour:'2-digit', minute:'2-digit', second:'2-digit'})}</span>
        </div>
      `).join('') || '<div class="text-muted">Keine Aktivitaet.</div>';

    } catch (e) {
      console.error('Admin refresh error:', e);
    }
  },

  escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }
};
