// Kanban-style shared board
window.TeamBoard = {
  _initialized: false,
  columns: [
    { id: 'timeline', name: 'Timeline', icon: '&#128337;' },
    { id: 'profiles', name: 'Profile', icon: '&#128100;' },
    { id: 'warnsignale', name: 'Warnsignale', icon: '&#9888;' },
    { id: 'interventions', name: 'Interventionen', icon: '&#128161;' }
  ],

  async onShow() {
    if (!this._initialized) {
      this._init();
      AppState.on('boardNotes', () => this.render());
      this._initialized = true;
    }
    await this.loadNotes();
  },

  _init() {
    const container = document.getElementById('board-container');
    container.innerHTML = this.columns.map(col => `
      <div class="board-column" data-column="${col.id}">
        <div class="board-column-header">
          <span>${col.icon} ${col.name}</span>
          <button class="btn btn-sm btn-secondary" data-add-column="${col.id}">+ Notiz</button>
        </div>
        <div class="board-cards" id="board-cards-${col.id}"></div>
      </div>
    `).join('');

    // Add note buttons
    container.querySelectorAll('[data-add-column]').forEach(btn => {
      btn.addEventListener('click', () => this.showAddNoteDialog(btn.dataset.addColumn));
    });
  },

  async loadNotes() {
    try {
      const { notes } = await API.getBoardNotes();
      AppState.set('boardNotes', notes);
      this.render();
    } catch (e) {}
  },

  render() {
    const notes = AppState.get('boardNotes') || [];

    for (const col of this.columns) {
      const container = document.getElementById('board-cards-' + col.id);
      if (!container) continue;

      const colNotes = notes.filter(n => n.column_name === col.id);

      if (colNotes.length === 0) {
        container.innerHTML = '<div class="text-muted text-xs" style="text-align:center; padding:1rem;">Noch keine Eintraege</div>';
        continue;
      }

      container.innerHTML = colNotes.map(note => {
        const tags = (() => { try { return JSON.parse(note.tags); } catch(e) { return []; } })();
        const commentCount = (note.comments || []).length;
        const spurColor = AppState.getSpurColor(note.team_name ? '' : '');
        const isOwn = note.team_id === (AppState.get('team') || {}).id;

        return `
          <div class="board-card ${isOwn ? '' : 'new-item-pulse'}" data-note-id="${note.id}">
            <div class="board-card-team" style="color:var(--accent);">${this.escapeHTML(note.team_name || 'Team')}</div>
            <div class="board-card-title">${this.escapeHTML(note.title)}</div>
            <div class="board-card-content">${this.escapeHTML(note.content)}</div>
            ${tags.length > 0 ? `
              <div style="display:flex; gap:0.2rem; flex-wrap:wrap; margin-top:0.3rem;">
                ${tags.slice(0, 3).map(t => `<span class="badge badge-type" style="font-size:0.65rem;">${this.escapeHTML(t)}</span>`).join('')}
              </div>
            ` : ''}
            <div class="board-card-footer">
              <span>${commentCount > 0 ? commentCount + ' Kommentar' + (commentCount > 1 ? 'e' : '') : ''}</span>
              <span>${new Date(note.created_at).toLocaleTimeString('de-DE', {hour:'2-digit', minute:'2-digit'})}</span>
            </div>
          </div>
        `;
      }).join('');

      // Click handlers for cards
      container.querySelectorAll('.board-card').forEach(card => {
        card.addEventListener('click', () => this.showNoteDetail(parseInt(card.dataset.noteId)));
      });
    }
  },

  showAddNoteDialog(columnName) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal" style="max-width:500px;">
        <div class="modal-header">
          <h2 style="font-size:1rem;">Neue Notiz</h2>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group mb-1">
            <label>Titel</label>
            <input type="text" id="new-note-title" placeholder="Kurzer Titel..." class="w-full">
          </div>
          <div class="form-group mb-1">
            <label>Inhalt</label>
            <textarea id="new-note-content" rows="4" placeholder="Beschreibung, Erkenntnisse..." class="w-full" style="resize:vertical;"></textarea>
          </div>
          <div class="form-group mb-2">
            <label>Tags (kommagetrennt)</label>
            <input type="text" id="new-note-tags" placeholder="z.B. warnsignal, isolation" class="w-full">
          </div>
          <button class="btn btn-primary w-full" id="save-note-btn">Speichern</button>
        </div>
      </div>
    `;

    document.getElementById('modal-container').appendChild(modal);
    modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
    modal.querySelector('#new-note-title').focus();

    modal.querySelector('#save-note-btn').addEventListener('click', async () => {
      const title = modal.querySelector('#new-note-title').value.trim();
      const content = modal.querySelector('#new-note-content').value.trim();
      const tagsStr = modal.querySelector('#new-note-tags').value.trim();
      const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(Boolean) : [];

      if (!title) {
        Notifications.show('Bitte Titel eingeben', 'warning');
        return;
      }

      try {
        await API.createBoardNote({ title, content, columnName, tags });
        modal.remove();
        Notifications.show('Notiz erstellt!', 'success');
      } catch (e) {
        Notifications.show('Fehler: ' + e.message, 'warning');
      }
    });
  },

  showNoteDetail(noteId) {
    const notes = AppState.get('boardNotes') || [];
    const note = notes.find(n => n.id === noteId);
    if (!note) return;

    const tags = (() => { try { return JSON.parse(note.tags); } catch(e) { return []; } })();
    const comments = note.comments || [];
    const isOwn = note.team_id === (AppState.get('team') || {}).id;

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal" style="max-width:600px;">
        <div class="modal-header">
          <div>
            <h2 style="font-size:1rem;">${this.escapeHTML(note.title)}</h2>
            <div class="text-xs text-muted">${this.escapeHTML(note.team_name)} | ${note.column_name} | ${new Date(note.created_at).toLocaleString('de-DE')}</div>
          </div>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <div style="white-space:pre-wrap; font-size:0.9rem; margin-bottom:1rem;">${this.escapeHTML(note.content)}</div>
          ${tags.length > 0 ? `<div style="display:flex; gap:0.3rem; flex-wrap:wrap; margin-bottom:1rem;">
            ${tags.map(t => `<span class="badge badge-type">${this.escapeHTML(t)}</span>`).join('')}
          </div>` : ''}
          ${isOwn ? `<button class="btn btn-danger btn-sm mb-2" id="delete-note-btn">Notiz loeschen</button>` : ''}
          <div style="border-top:1px solid var(--border); padding-top:1rem;">
            <h4 style="font-size:0.85rem; margin-bottom:0.5rem;">Kommentare (${comments.length})</h4>
            <div id="note-comments">
              ${comments.map(c => `
                <div style="padding:0.4rem 0; border-bottom:1px solid var(--border);">
                  <span style="font-weight:600; font-size:0.83rem; color:var(--accent);">${this.escapeHTML(c.team_name)}</span>
                  <span class="text-xs text-muted">${new Date(c.created_at).toLocaleTimeString('de-DE', {hour:'2-digit', minute:'2-digit'})}</span>
                  <div style="font-size:0.85rem; margin-top:0.15rem;">${this.escapeHTML(c.content)}</div>
                </div>
              `).join('')}
            </div>
            <div style="display:flex; gap:0.5rem; margin-top:0.75rem;">
              <input type="text" id="comment-input" placeholder="Kommentar schreiben..." style="flex:1;">
              <button class="btn btn-primary btn-sm" id="add-comment-btn">Senden</button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('modal-container').appendChild(modal);
    modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    // Delete handler
    if (isOwn) {
      modal.querySelector('#delete-note-btn').addEventListener('click', async () => {
        try {
          await API.deleteBoardNote(noteId);
          modal.remove();
          Notifications.show('Notiz geloescht', 'success');
          this.loadNotes();
        } catch (e) {
          Notifications.show('Fehler: ' + e.message, 'warning');
        }
      });
    }

    // Comment handler
    modal.querySelector('#add-comment-btn').addEventListener('click', async () => {
      const input = modal.querySelector('#comment-input');
      const content = input.value.trim();
      if (!content) return;
      try {
        await API.addBoardComment(noteId, content);
        input.value = '';
        modal.remove();
        this.loadNotes();
        Notifications.show('Kommentar hinzugefuegt', 'success');
      } catch (e) {
        Notifications.show('Fehler: ' + e.message, 'warning');
      }
    });
  },

  escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }
};
