// Investigation Central - main gameplay screen
window.InvestigationCentral = {
  _initialized: false,
  _currentSpur: null,
  _searchTimeout: null,

  async onShow() {
    if (!this._initialized) {
      this._init();
      this._initialized = true;
    }
    this.loadSpurStats();
    this.loadEvidence();
    this.loadTeamFindings();
  },

  _init() {
    // Search input
    document.getElementById('evidence-search').addEventListener('input', (e) => {
      clearTimeout(this._searchTimeout);
      this._searchTimeout = setTimeout(() => this.loadEvidence(), 400);
    });

    // Filter changes
    ['filter-type', 'filter-source', 'filter-importance'].forEach(id => {
      document.getElementById(id).addEventListener('change', () => this.loadEvidence());
    });

    // Load filter options
    this.loadFilters();
  },

  async loadFilters() {
    try {
      const { types, sources } = await API.getEvidenceFilters();
      const typeSelect = document.getElementById('filter-type');
      types.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t;
        opt.textContent = AppState.getTypeLabel(t);
        typeSelect.appendChild(opt);
      });

      const sourceSelect = document.getElementById('filter-source');
      sources.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s;
        opt.textContent = s;
        sourceSelect.appendChild(opt);
      });
    } catch (e) {}
  },

  async loadSpurStats() {
    try {
      const { stats } = await API.getEvidenceStats();
      AppState.set('spurStats', stats);
      this.renderSpurSidebar(stats);
    } catch (e) {}
  },

  renderSpurSidebar(stats) {
    const container = document.getElementById('spur-list');
    const allTotal = stats.reduce((a, s) => a + s.total, 0);
    const allDiscovered = stats.reduce((a, s) => a + s.discovered, 0);

    let html = `
      <div class="spur-item ${!this._currentSpur ? 'active' : ''}" data-spur="">
        <span class="spur-item-name">Alle Spuren</span>
        <span class="spur-item-count">${allDiscovered}/${allTotal}</span>
      </div>
    `;

    const spurOrder = ['gamer', 'creator', 'discord', 'social-media', 'algorithmus'];
    for (const spurKey of spurOrder) {
      const s = stats.find(st => st.spur === spurKey);
      if (!s) continue;
      const pct = s.total > 0 ? Math.round((s.discovered / s.total) * 100) : 0;
      const color = AppState.getSpurColor(spurKey);
      html += `
        <div class="spur-item ${this._currentSpur === spurKey ? 'active' : ''}" data-spur="${spurKey}">
          <div>
            <div class="spur-item-name">${AppState.getSpurName(spurKey)}</div>
            <div class="progress-bar" style="width:120px; margin-top:4px;">
              <div class="progress-bar-fill" style="width:${pct}%; background:${color};"></div>
            </div>
          </div>
          <span class="spur-item-count">${pct}%</span>
        </div>
      `;
    }

    container.innerHTML = html;

    // Click handlers
    container.querySelectorAll('.spur-item').forEach(item => {
      item.addEventListener('click', () => {
        this._currentSpur = item.dataset.spur || null;
        this.renderSpurSidebar(AppState.get('spurStats') || []);
        this.loadEvidence();
      });
    });
  },

  async loadEvidence() {
    const loading = document.getElementById('evidence-loading');
    loading.textContent = 'Lade Beweise...';

    const params = {};
    const q = document.getElementById('evidence-search').value.trim();
    if (q) params.q = q;
    if (this._currentSpur) params.spur = this._currentSpur;

    const type = document.getElementById('filter-type').value;
    if (type) params.type = type;
    const source = document.getElementById('filter-source').value;
    if (source) params.source = source;
    const importance = document.getElementById('filter-importance').value;
    if (importance) params.importance = importance;

    try {
      const { results } = await API.searchEvidence(params);
      this.renderEvidenceList(results);
      loading.textContent = results.length === 0 ? 'Keine Beweise gefunden.' : '';
    } catch (e) {
      loading.textContent = 'Fehler beim Laden.';
    }
  },

  renderEvidenceList(items) {
    const container = document.getElementById('evidence-list');
    if (items.length === 0) {
      container.innerHTML = '';
      return;
    }

    container.innerHTML = items.map(ev => {
      const preview = typeof ev.content === 'string'
        ? ev.content.substring(0, 150)
        : (ev.title || '');

      return `
        <div class="evidence-card" data-id="${ev.id}">
          <div class="evidence-card-header">
            <span class="evidence-card-title">${this.escapeHTML(ev.title)}</span>
            ${EvidenceViewer.renderImportance(ev.importance)}
          </div>
          <div class="evidence-card-meta">
            <span class="badge badge-spur-${ev.spur}">${AppState.getSpurName(ev.spur)}</span>
            <span class="badge badge-type">${AppState.getTypeLabel(ev.type)}</span>
            <span class="text-xs text-muted">${ev.date}</span>
          </div>
          <div class="evidence-card-preview">${this.escapeHTML(preview)}</div>
        </div>
      `;
    }).join('');

    // Click handlers
    container.querySelectorAll('.evidence-card').forEach(card => {
      card.addEventListener('click', async () => {
        try {
          const { evidence } = await API.getEvidence(card.dataset.id);
          EvidenceViewer.open(evidence);
        } catch (e) {
          Notifications.show('Fehler beim Laden des Beweises', 'warning');
        }
      });
    });
  },

  async loadTeamFindings() {
    const container = document.getElementById('team-findings-list');
    try {
      const { notes } = await API.getBoardNotes();
      const teamId = (AppState.get('team') || {}).id;
      const teamNotes = notes.filter(n => n.team_id === teamId).slice(0, 15);

      if (teamNotes.length === 0) {
        container.innerHTML = '<div class="text-muted text-sm">Noch keine Erkenntnisse gepinnt. Klicke auf einen Beweis und hefte ihn an die Pinnwand.</div>';
        return;
      }

      container.innerHTML = teamNotes.map(note => `
        <div class="card mb-1" style="padding:0.6rem;">
          <div style="font-size:0.83rem; font-weight:600;">${this.escapeHTML(note.title)}</div>
          <div class="text-xs text-muted mt-1">${note.column_name} | ${new Date(note.created_at).toLocaleTimeString('de-DE', {hour:'2-digit', minute:'2-digit'})}</div>
        </div>
      `).join('');
    } catch (e) {
      container.innerHTML = '<div class="text-muted text-sm">Fehler beim Laden.</div>';
    }
  },

  escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }
};
