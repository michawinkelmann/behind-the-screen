// Admin panel for teacher
window.AdminPanel = {
  _initialized: false,
  _refreshInterval: null,
  _boardFilter: 'all',
  _boardListenerBound: false,

  async onShow() {
    if (!AppState.get('isAdmin')) {
      document.getElementById('admin-container').innerHTML = '<div class="text-muted" style="padding:2rem; text-align:center;">Kein Admin-Zugriff. Bitte als Admin anmelden.</div>';
      return;
    }
    this.render();
    if (!this._boardListenerBound) {
      AppState.on('boardNotes', () => {
        if (AppState.get('currentScreen') === 'admin') this.renderBoardNotes();
      });
      this._boardListenerBound = true;
    }
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
        <div style="display:flex; gap:0.5rem; align-items:center; margin-bottom:1rem; flex-wrap:wrap;">
          <label class="text-sm">Tag:</label>
          <button class="btn btn-sm btn-secondary" data-set-day="1">Tag 1</button>
          <button class="btn btn-sm btn-secondary" data-set-day="2">Tag 2</button>
          <button class="btn btn-sm btn-secondary" data-set-day="3">Tag 3</button>
          <span style="margin-left:1rem;" class="text-sm">Phasendauer:</span>
          <input type="number" id="admin-duration-input" min="1" max="240" style="width:4.5rem;">
          <button class="btn btn-sm btn-secondary" id="admin-duration-btn">Min. setzen</button>
        </div>
        <div id="admin-game-state" class="text-sm text-muted"></div>
      </div>

      ${window.TeacherPresentations ? TeacherPresentations.renderAdminSection(() => this._currentDayPhase()) : ''}

      <!-- Broadcast -->
      <div class="admin-section">
        <h3>Nachricht senden</h3>
        <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
          <input type="text" id="admin-broadcast-input" placeholder="Nachricht an alle Teams..." maxlength="500" style="flex:1; min-width:220px;">
          <button class="btn btn-primary" id="admin-broadcast-btn">Senden</button>
          <button class="btn btn-secondary" id="admin-clear-broadcast-btn" title="Aktuelle Nachricht entfernen">Banner schliessen</button>
        </div>
      </div>

      <!-- Teams Overview -->
      <div class="admin-section">
        <h3>Teams</h3>
        <div id="admin-teams-list"></div>
      </div>

      <!-- Pinnwand (Live-Mitlesen) -->
      <div class="admin-section">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
          <h3 style="margin:0;">Pinnwand <span class="text-xs text-muted" id="admin-board-count"></span></h3>
          <div style="display:flex; gap:0.3rem; flex-wrap:wrap;">
            <button class="btn btn-sm btn-secondary admin-board-filter" data-column="all">Alle</button>
            <button class="btn btn-sm btn-secondary admin-board-filter" data-column="timeline">Timeline</button>
            <button class="btn btn-sm btn-secondary admin-board-filter" data-column="profiles">Profile</button>
            <button class="btn btn-sm btn-secondary admin-board-filter" data-column="warnsignale">Warnsignale</button>
            <button class="btn btn-sm btn-secondary admin-board-filter" data-column="interventions">Interventionen</button>
          </div>
        </div>
        <div id="admin-board-notes" style="margin-top:0.75rem; max-height:420px; overflow-y:auto;"></div>
      </div>

      <!-- Presence -->
      <div class="admin-section">
        <h3>Team-Praesenz <span class="text-xs text-muted" id="admin-presence-count"></span></h3>
        <div id="admin-presence-list" class="text-sm"></div>
      </div>

      <!-- Heatmap -->
      <div class="admin-section">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
          <h3 style="margin:0;">Aktivitaets-Heatmap</h3>
          <div>
            <label class="text-xs text-muted">Fenster:</label>
            <select id="admin-heatmap-minutes" style="font-size:0.8rem;">
              <option value="30">30 Min.</option>
              <option value="60" selected>60 Min.</option>
              <option value="120">2 Std.</option>
              <option value="240">4 Std.</option>
            </select>
          </div>
        </div>
        <div id="admin-heatmap" style="margin-top:0.5rem;"></div>
      </div>

      <!-- Activity Log -->
      <div class="admin-section">
        <h3>Aktivitaet</h3>
        <div id="admin-activity-log" style="max-height:300px; overflow-y:auto;"></div>
      </div>

      <!-- Audit Log -->
      <div class="admin-section">
        <h3>Admin-Audit-Log <span class="text-xs text-muted" id="admin-audit-count"></span></h3>
        <div id="admin-audit-log" style="max-height:260px; overflow-y:auto;"></div>
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
        <button class="btn btn-secondary" id="admin-export-btn" style="margin-left:0.5rem;">JSON-Export</button>
        <button class="btn btn-secondary" id="admin-export-md-btn" style="margin-left:0.5rem;">Markdown-Export</button>
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
      try {
        await API.adminBroadcast(msg);
        input.value = '';
        Notifications.show('Nachricht gesendet', 'success');
      } catch (e) {
        Notifications.show('Fehler: ' + e.message, 'warning');
      }
    });

    document.getElementById('admin-clear-broadcast-btn').addEventListener('click', async () => {
      try {
        await API.adminClearBroadcast();
        Notifications.show('Banner entfernt', 'success');
      } catch (e) {
        Notifications.show('Fehler: ' + e.message, 'warning');
      }
    });

    document.getElementById('admin-duration-btn').addEventListener('click', async () => {
      const input = document.getElementById('admin-duration-input');
      const minutes = parseInt(input.value, 10);
      if (!Number.isFinite(minutes) || minutes < 1 || minutes > 240) {
        Notifications.show('Dauer muss 1-240 Minuten sein', 'warning');
        return;
      }
      try {
        await API.adminSetDuration(minutes);
        Notifications.show(`Phasendauer ${minutes} Min. gesetzt`, 'success');
        this.refresh();
      } catch (e) {
        Notifications.show('Fehler: ' + e.message, 'warning');
      }
    });

    document.getElementById('admin-reset-btn').addEventListener('click', async () => {
      if (confirm('Spiel wirklich zuruecksetzen? Alle Fortschritte gehen verloren!')) {
        await API.adminReset();
        Notifications.show('Spiel zurueckgesetzt', 'warning');
        this.refresh();
      }
    });

    // Pinnwand filter
    container.querySelectorAll('.admin-board-filter').forEach(btn => {
      btn.addEventListener('click', () => {
        this._boardFilter = btn.dataset.column;
        container.querySelectorAll('.admin-board-filter').forEach(b => {
          b.classList.toggle('btn-primary', b.dataset.column === this._boardFilter);
          b.classList.toggle('btn-secondary', b.dataset.column !== this._boardFilter);
        });
        this.renderBoardNotes();
      });
    });
    const activeFilterBtn = container.querySelector(`.admin-board-filter[data-column="${this._boardFilter}"]`);
    if (activeFilterBtn) {
      activeFilterBtn.classList.remove('btn-secondary');
      activeFilterBtn.classList.add('btn-primary');
    }

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

    document.getElementById('admin-export-md-btn').addEventListener('click', async () => {
      try {
        const res = await fetch('/api/admin/export/markdown', {
          headers: {
            'X-Admin-Token': AppState.get('adminPassword') || '',
            'X-Session-Token': AppState.get('token') || ''
          }
        });
        if (!res.ok) throw new Error('Export fehlgeschlagen');
        const text = await res.text();
        const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'behind-the-screen-export.md';
        a.click();
        URL.revokeObjectURL(url);
        Notifications.show('Markdown-Export heruntergeladen', 'success');
      } catch (e) {
        Notifications.show('Fehler: ' + e.message, 'warning');
      }
    });

    const heatmapSel = document.getElementById('admin-heatmap-minutes');
    if (heatmapSel) heatmapSel.addEventListener('change', () => this.loadHeatmap());

    if (window.TeacherPresentations) {
      TeacherPresentations.bindAdminSection(() => this._currentDayPhase());
    }

    // Load connection info
    this.loadConnectionInfo();
  },

  _currentDayPhase() {
    const gs = AppState.get('gameState') || {};
    const day = Number.parseInt(gs.current_day, 10) || 1;
    const phase = Number.parseInt(gs.current_phase, 10) || 1;
    return { day, phase };
  },

  async loadPresence() {
    try {
      const { presence } = await API.adminGetPresence();
      const el = document.getElementById('admin-presence-list');
      const count = document.getElementById('admin-presence-count');
      if (!el) return;
      if (count) count.textContent = `(${presence.length} online)`;
      if (presence.length === 0) {
        el.innerHTML = '<div class="text-muted">Aktuell keine Teams online.</div>';
        return;
      }
      el.innerHTML = presence.map(p => {
        const idleLabel = p.idleSeconds < 60
          ? 'aktiv'
          : p.idleSeconds < 300 ? `${Math.round(p.idleSeconds / 60)} Min. idle` : `${Math.round(p.idleSeconds / 60)} Min. idle`;
        const color = p.idleSeconds < 60 ? 'var(--success)' : p.idleSeconds < 300 ? 'var(--warning)' : 'var(--text-muted)';
        return `
          <div style="display:flex; justify-content:space-between; align-items:center; padding:0.3rem 0; border-bottom:1px solid var(--border);">
            <span><strong>${this.escapeHTML(p.teamName || 'Team')}</strong>
              <span class="text-xs text-muted" style="margin-left:0.4rem;">${p.sockets} Tab${p.sockets !== 1 ? 's' : ''}</span>
            </span>
            <span class="text-xs" style="color:${color};">${idleLabel}</span>
          </div>
        `;
      }).join('');
    } catch (e) {}
  },

  async loadHeatmap() {
    try {
      const sel = document.getElementById('admin-heatmap-minutes');
      const minutes = sel ? parseInt(sel.value, 10) || 60 : 60;
      const data = await API.adminGetHeatmap(minutes, 5);
      const el = document.getElementById('admin-heatmap');
      if (!el) return;
      if (!data.teams || data.teams.length === 0) {
        el.innerHTML = '<div class="text-muted text-sm">Noch keine Aktivitaet im gewaehlten Fenster.</div>';
        return;
      }
      const max = Math.max(1, ...data.teams.flatMap(t => t.counts));
      el.innerHTML = data.teams.map(t => `
        <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.2rem;">
          <div style="width:110px; font-size:0.78rem;" title="${this.escapeHTML(t.teamName || '')}">${this.escapeHTML((t.teamName || '-').slice(0, 14))}</div>
          <div style="display:flex; gap:2px; flex:1;">
            ${t.counts.map(c => {
              const intensity = Math.min(1, c / max);
              const alpha = c === 0 ? 0.08 : 0.2 + intensity * 0.8;
              return `<div title="${c} Aktionen" style="flex:1; height:18px; background:rgba(99, 179, 237, ${alpha}); border-radius:2px;"></div>`;
            }).join('')}
          </div>
          <div style="width:40px; text-align:right; font-size:0.78rem; color:var(--text-muted);">${t.total}</div>
        </div>
      `).join('') + `<div class="text-xs text-muted" style="margin-top:0.3rem;">Je Spalte = ${data.bucketMinutes} Minuten (links = alt, rechts = neu)</div>`;
    } catch (e) {}
  },

  async loadAudit() {
    try {
      const { entries, total } = await API.adminGetAudit(30, 0);
      const el = document.getElementById('admin-audit-log');
      const count = document.getElementById('admin-audit-count');
      if (count) count.textContent = `(${total})`;
      if (!el) return;
      if (!entries || entries.length === 0) {
        el.innerHTML = '<div class="text-muted text-sm">Noch keine Admin-Aktionen protokolliert.</div>';
        return;
      }
      el.innerHTML = entries.map(e => {
        let details = '';
        try {
          const d = JSON.parse(e.details || '{}');
          const parts = Object.entries(d).map(([k, v]) => `${k}=${typeof v === 'object' ? JSON.stringify(v) : String(v).slice(0, 60)}`);
          if (parts.length) details = parts.join(' | ');
        } catch (_) {}
        return `
          <div style="font-size:0.78rem; padding:0.25rem 0; border-bottom:1px solid var(--border);">
            <span style="color:var(--accent); font-weight:600;">${this.escapeHTML(e.action)}</span>
            ${details ? `<span class="text-muted" style="margin-left:0.3rem;">${this.escapeHTML(details)}</span>` : ''}
            <span class="text-muted" style="float:right;">${new Date(e.created_at).toLocaleTimeString('de-DE', {hour:'2-digit', minute:'2-digit', second:'2-digit'})}</span>
          </div>
        `;
      }).join('');
    } catch (e) {}
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
          <div style="text-align:center;" id="admin-qr-wrap">
            <div style="font-weight:600; margin-bottom:0.5rem;">QR-Code:</div>
            <img id="admin-qr-img" src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(info.url)}"
                 alt="QR Code" style="border-radius:8px; background:#fff; padding:8px;" width="160" height="160">
            <div class="text-xs text-muted mt-1">Scannen zum Verbinden</div>
          </div>
        </div>
      `;
      const qr = document.getElementById('admin-qr-img');
      if (qr) {
        qr.addEventListener('error', () => {
          const wrap = document.getElementById('admin-qr-wrap');
          if (wrap) wrap.innerHTML = '<div class="text-muted text-sm">QR-Code benoetigt Internet</div>';
        });
      }
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
        | Dauer: ${gameState.phase_duration_minutes || 60} Min.
        ${gameState.teacher_message ? `<br>Aktuelle Nachricht: "${this.escapeHTML(gameState.teacher_message)}"` : ''}
      `;
      const durInput = document.getElementById('admin-duration-input');
      if (durInput && document.activeElement !== durInput) {
        durInput.value = gameState.phase_duration_minutes || 60;
      }

      const tpLabel = document.getElementById('tp-current-label');
      if (tpLabel && window.TeacherPresentations) {
        const phaseName = TeacherPresentations.PHASE_NAMES[gameState.current_phase] || gameState.current_phase;
        tpLabel.textContent = `Aktuell: Tag ${gameState.current_day} - ${phaseName}`;
      }

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

      // Pinnwand notes
      try {
        const { notes } = await API.getBoardNotes();
        AppState.set('boardNotes', notes || []);
      } catch (e) {
        this.renderBoardNotes();
      }

      // Activity
      const { recent } = await API.adminGetActivity();
      document.getElementById('admin-activity-log').innerHTML = recent.slice(0, 30).map(r => `
        <div style="font-size:0.78rem; padding:0.25rem 0; border-bottom:1px solid var(--border);">
          <span style="color:var(--accent);">${this.escapeHTML(r.team_name)}</span>
          <span class="text-muted">${r.action_type}</span>
          <span class="text-muted" style="float:right;">${new Date(r.timestamp).toLocaleTimeString('de-DE', {hour:'2-digit', minute:'2-digit', second:'2-digit'})}</span>
        </div>
      `).join('') || '<div class="text-muted">Keine Aktivitaet.</div>';

      // Parallel fetch of presence, heatmap and audit (non-critical)
      await Promise.all([
        this.loadPresence().catch(() => {}),
        this.loadHeatmap().catch(() => {}),
        this.loadAudit().catch(() => {})
      ]);

    } catch (e) {
      console.error('Admin refresh error:', e);
    }
  },

  renderBoardNotes() {
    const container = document.getElementById('admin-board-notes');
    const countEl = document.getElementById('admin-board-count');
    if (!container) return;

    const all = AppState.get('boardNotes') || [];
    const notes = this._boardFilter === 'all'
      ? all
      : all.filter(n => n.column_name === this._boardFilter);

    if (countEl) {
      countEl.textContent = this._boardFilter === 'all'
        ? `(${all.length} gesamt)`
        : `(${notes.length} / ${all.length})`;
    }

    if (notes.length === 0) {
      container.innerHTML = '<div class="text-muted text-sm" style="padding:1rem; text-align:center;">Noch keine Pinnwand-Eintraege.</div>';
      return;
    }

    const columnLabels = {
      timeline: 'Timeline',
      profiles: 'Profile',
      warnsignale: 'Warnsignale',
      interventions: 'Interventionen'
    };

    container.innerHTML = notes.map(note => {
      const tags = (() => { try { return JSON.parse(note.tags); } catch (e) { return []; } })();
      const commentCount = (note.comments || []).length;
      const content = note.content && note.content.length > 240
        ? note.content.slice(0, 240) + '...'
        : (note.content || '');

      return `
        <div class="card mb-1" style="padding:0.6rem;">
          <div style="display:flex; justify-content:space-between; align-items:baseline; gap:0.5rem; flex-wrap:wrap;">
            <div>
              <strong>${this.escapeHTML(note.title)}</strong>
              <span class="badge badge-type" style="margin-left:0.3rem;">${columnLabels[note.column_name] || note.column_name}</span>
            </div>
            <span class="text-xs text-muted">${new Date(note.created_at).toLocaleTimeString('de-DE', {hour:'2-digit', minute:'2-digit'})}</span>
          </div>
          <div class="text-xs" style="color:var(--accent); margin-top:0.15rem;">${this.escapeHTML(note.team_name || 'Team')}</div>
          ${content ? `<div class="text-sm" style="margin-top:0.3rem; white-space:pre-wrap;">${this.escapeHTML(content)}</div>` : ''}
          ${tags.length > 0 ? `
            <div style="display:flex; gap:0.2rem; flex-wrap:wrap; margin-top:0.3rem;">
              ${tags.slice(0, 5).map(t => `<span class="badge badge-type" style="font-size:0.65rem;">${this.escapeHTML(t)}</span>`).join('')}
            </div>
          ` : ''}
          ${commentCount > 0 ? `<div class="text-xs text-muted" style="margin-top:0.3rem;">${commentCount} Kommentar${commentCount > 1 ? 'e' : ''}</div>` : ''}
        </div>
      `;
    }).join('');
  },

  escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }
};
