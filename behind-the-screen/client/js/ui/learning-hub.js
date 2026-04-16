// Learning modules display
window.LearningHub = {
  _initialized: false,
  _modules: [],
  _completed: [],

  async onShow() {
    await this.loadModules();
  },

  async loadModules() {
    try {
      const data = await API.getModules();
      this._modules = data.modules || [];
      this._completed = data.completed || [];
      this.renderSidebar();
    } catch (e) {
      document.getElementById('modules-sidebar').innerHTML = '<div class="text-muted text-sm" style="padding:1rem;">Fehler beim Laden der Module.</div>';
    }
  },

  renderSidebar() {
    const container = document.getElementById('modules-sidebar');
    if (this._modules.length === 0) {
      container.innerHTML = '<div class="text-muted text-sm" style="padding:1rem;">Keine Module verfuegbar.</div>';
      return;
    }

    const byDay = {};
    this._modules.forEach(m => {
      if (!byDay[m.day]) byDay[m.day] = [];
      byDay[m.day].push(m);
    });

    const dayNames = { 1: 'Tag 1 - Der Fall', 2: 'Tag 2 - Die Mechanismen', 3: 'Tag 3 - Die Loesung' };

    let html = '';
    for (const day of [1, 2, 3]) {
      if (!byDay[day]) continue;
      html += `<h4 style="font-size:0.8rem; color:var(--text-muted); margin:0.75rem 0 0.4rem; text-transform:uppercase;">${dayNames[day]}</h4>`;
      html += byDay[day].map(m => {
        const done = this._completed.includes(m.id);
        return `
          <div class="spur-item" data-module-id="${m.id}" style="cursor:pointer;">
            <div style="display:flex; align-items:center; gap:0.5rem;">
              <span style="color:${done ? 'var(--success)' : 'var(--text-muted)'}; font-size:1rem;">${done ? '&#10003;' : '&#9675;'}</span>
              <div>
                <div class="spur-item-name" style="font-size:0.83rem;">${this.escapeHTML(m.title)}</div>
                <div class="text-xs text-muted">${m.duration || ''}</div>
              </div>
            </div>
          </div>
        `;
      }).join('');
    }

    container.innerHTML = html;

    container.querySelectorAll('[data-module-id]').forEach(item => {
      item.addEventListener('click', () => this.showModule(item.dataset.moduleId));
    });
  },

  async showModule(moduleId) {
    const contentEl = document.getElementById('modules-content');
    contentEl.innerHTML = '<div class="text-muted" style="text-align:center; margin-top:2rem;">Lade Modul...</div>';

    try {
      const { module } = await API.getModule(moduleId);
      this.renderModule(module);
    } catch (e) {
      contentEl.innerHTML = '<div class="text-muted">Fehler beim Laden des Moduls.</div>';
    }
  },

  renderModule(mod) {
    const contentEl = document.getElementById('modules-content');
    const done = this._completed.includes(mod.id);
    const sections = mod.sections || [];

    let sectionsHTML = sections.map(section => {
      if (section.type === 'text') {
        return `<div style="margin-bottom:1.5rem; font-size:0.9rem; line-height:1.7; white-space:pre-wrap;">${this.escapeHTML(section.content)}</div>`;
      }
      if (section.type === 'heading') {
        return `<h3 style="font-size:1rem; margin:1.5rem 0 0.5rem; color:var(--accent);">${this.escapeHTML(section.content)}</h3>`;
      }
      if (section.type === 'list') {
        return `<ul style="padding-left:1.5rem; margin-bottom:1rem;">
          ${(section.items || []).map(item => `<li style="font-size:0.9rem; margin-bottom:0.3rem;">${this.escapeHTML(item)}</li>`).join('')}
        </ul>`;
      }
      if (section.type === 'example') {
        return `<div class="card mb-1" style="border-left:3px solid var(--accent);">
          <div style="font-size:0.83rem; font-weight:600; margin-bottom:0.3rem;">${this.escapeHTML(section.title || 'Beispiel')}</div>
          <div style="font-size:0.88rem; white-space:pre-wrap;">${this.escapeHTML(section.content)}</div>
        </div>`;
      }
      if (section.type === 'reflection') {
        return `<div class="card mb-1" style="border-left:3px solid var(--orange); background:var(--orange-light);">
          <div style="font-size:0.83rem; font-weight:600; margin-bottom:0.3rem; color:var(--orange);">Reflexionsfrage</div>
          <div style="font-size:0.9rem;">${this.escapeHTML(section.question || section.content)}</div>
          <textarea style="width:100%; margin-top:0.5rem; min-height:60px; resize:vertical;" placeholder="Deine Antwort..."></textarea>
        </div>`;
      }
      if (section.type === 'simulation_intro') {
        return `<div class="card mb-1" style="border-left:3px solid var(--info);">
          <div style="font-size:0.83rem; font-weight:600; margin-bottom:0.3rem; color:var(--info);">Interaktive Uebung</div>
          <div style="font-size:0.88rem;">${this.escapeHTML(section.content)}</div>
        </div>`;
      }
      return `<div style="margin-bottom:1rem; font-size:0.9rem;">${this.escapeHTML(section.content || JSON.stringify(section))}</div>`;
    }).join('');

    contentEl.innerHTML = `
      <div style="max-width:720px;">
        <h2 style="font-size:1.3rem; margin-bottom:0.25rem;">${this.escapeHTML(mod.title)}</h2>
        <div class="text-sm text-muted mb-2">Tag ${mod.day} | ${mod.duration || ''}</div>
        ${mod.description ? `<p style="font-size:0.95rem; margin-bottom:1.5rem; color:var(--text-secondary);">${this.escapeHTML(mod.description)}</p>` : ''}
        ${sectionsHTML}
        <div style="margin-top:2rem; padding-top:1rem; border-top:1px solid var(--border);">
          ${done
            ? '<div style="color:var(--success); font-weight:600;">&#10003; Modul abgeschlossen</div>'
            : `<button class="btn btn-primary" id="complete-module-btn">Modul als abgeschlossen markieren</button>`
          }
        </div>
      </div>
    `;

    if (!done) {
      contentEl.querySelector('#complete-module-btn').addEventListener('click', async () => {
        try {
          await API.completeModule(mod.id);
          this._completed.push(mod.id);
          this.renderSidebar();
          this.renderModule(mod);
          Notifications.show('Modul abgeschlossen!', 'success');
        } catch (e) {
          Notifications.show('Fehler: ' + e.message, 'warning');
        }
      });
    }
  },

  escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }
};
