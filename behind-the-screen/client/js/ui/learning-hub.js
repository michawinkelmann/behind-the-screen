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

    html += `
      <div style="margin-top:1rem; padding-top:0.75rem; border-top:1px solid var(--border);">
        <button class="btn btn-secondary btn-sm w-full" id="export-reflections-btn">Reflexionen exportieren</button>
      </div>
    `;

    container.innerHTML = html;

    container.querySelectorAll('[data-module-id]').forEach(item => {
      item.addEventListener('click', () => this.showModule(item.dataset.moduleId));
    });
    const exportBtn = container.querySelector('#export-reflections-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportReflections());
    }
  },

  exportReflections() {
    const team = AppState.get('team') || {};
    const prefix = `bts_reflection:${team.id || 'anon'}:`;
    const entries = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(prefix)) continue;
      const rest = key.slice(prefix.length);
      const colon = rest.indexOf(':');
      if (colon < 0) continue;
      const moduleId = rest.slice(0, colon);
      const question = rest.slice(colon + 1);
      const answer = localStorage.getItem(key) || '';
      if (!answer.trim()) continue;
      entries.push({ moduleId, question, answer });
    }

    if (entries.length === 0) {
      Notifications.show('Keine gespeicherten Antworten gefunden.', 'info');
      return;
    }

    const modules = new Map(this._modules.map(m => [m.id, m]));
    const byModule = new Map();
    for (const e of entries) {
      if (!byModule.has(e.moduleId)) byModule.set(e.moduleId, []);
      byModule.get(e.moduleId).push(e);
    }

    const lines = [];
    lines.push(`# Reflexionen - ${team.name || 'Team'}`);
    lines.push('');
    lines.push(`_Exportiert: ${new Date().toLocaleString('de-DE')}_`);
    lines.push('');
    for (const [moduleId, list] of byModule) {
      const mod = modules.get(moduleId);
      lines.push(`## ${mod ? mod.title : moduleId}`);
      lines.push('');
      if (mod && mod.day) lines.push(`_Tag ${mod.day}${mod.duration ? ' - ' + mod.duration : ''}_`);
      lines.push('');
      for (const e of list) {
        lines.push(`**Frage:** ${e.question}`);
        lines.push('');
        lines.push(e.answer.split(/\r?\n/).map(l => '> ' + l).join('\n'));
        lines.push('');
      }
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reflexionen-${(team.name || 'team').replace(/[^a-z0-9]/gi, '_')}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    Notifications.show('Reflexionen exportiert.', 'success');
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
        const qText = section.question || section.content || '';
        const key = this._answerKey(mod.id, qText);
        return `<div class="card mb-1" style="border-left:3px solid var(--orange); background:var(--orange-light);">
          <div style="font-size:0.83rem; font-weight:600; margin-bottom:0.3rem; color:var(--orange);">Reflexionsfrage</div>
          <div style="font-size:0.9rem;">${this.escapeHTML(qText)}</div>
          <textarea data-answer-key="${this.escapeHTML(key)}" style="width:100%; margin-top:0.5rem; min-height:60px; resize:vertical;" placeholder="Deine Antwort..."></textarea>
          <div class="text-xs text-muted" style="margin-top:0.25rem;" data-saved-label>Wird lokal gespeichert.</div>
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

    // Restore and persist reflection answers in localStorage (stays on student's device).
    contentEl.querySelectorAll('textarea[data-answer-key]').forEach(ta => {
      const key = ta.dataset.answerKey;
      try {
        const saved = localStorage.getItem(key);
        if (saved) ta.value = saved;
      } catch (_) {}
      let saveTimer = null;
      const label = ta.parentElement.querySelector('[data-saved-label]');
      ta.addEventListener('input', () => {
        clearTimeout(saveTimer);
        saveTimer = setTimeout(() => {
          try {
            localStorage.setItem(key, ta.value);
            if (label) label.textContent = 'Gespeichert ' + new Date().toLocaleTimeString('de-DE', {hour:'2-digit', minute:'2-digit'});
          } catch (_) {}
        }, 400);
      });
    });
  },

  _answerKey(moduleId, question) {
    const team = AppState.get('team') || {};
    // Shorten to keep keys readable; hash-free is fine for localStorage scope.
    return `bts_reflection:${team.id || 'anon'}:${moduleId}:${(question || '').slice(0, 60)}`;
  },

  escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }
};
