// Evidence detail modal viewer
window.EvidenceViewer = {
  open(evidence) {
    const content = typeof evidence.content === 'string'
      ? (() => { try { return JSON.parse(evidence.content); } catch(e) { return evidence.content; } })()
      : evidence.content;
    const analysis = typeof evidence.analysis === 'string'
      ? (() => { try { return JSON.parse(evidence.analysis); } catch(e) { return {}; } })()
      : (evidence.analysis || {});
    const tags = typeof evidence.warnsignale_tags === 'string'
      ? (() => { try { return JSON.parse(evidence.warnsignale_tags); } catch(e) { return []; } })()
      : (evidence.warnsignale_tags || []);

    let bodyHTML = '';

    // Render based on type
    if (evidence.type === 'chat_protocol' && Array.isArray(content)) {
      bodyHTML = ChatViewer.render(content);
    } else if (evidence.type === 'profile' && typeof content === 'object') {
      bodyHTML = ProfileViewer.render(content, evidence);
    } else if (typeof content === 'string') {
      bodyHTML = `<div style="white-space:pre-wrap; line-height:1.6; font-size:0.9rem;">${this.escapeHTML(content)}</div>`;
    } else if (typeof content === 'object') {
      bodyHTML = this.renderObject(content);
    }

    // Tags
    const tagsHTML = tags.length > 0 ? `
      <div style="margin-top:1rem; display:flex; gap:0.3rem; flex-wrap:wrap;">
        ${tags.map(t => `<span class="badge badge-type">${this.escapeHTML(t)}</span>`).join('')}
      </div>
    ` : '';

    // Analysis section
    const analysisHTML = Object.keys(analysis).length > 0 ? `
      <div style="margin-top:1.5rem; padding:1rem; background:var(--bg-card); border-radius:var(--radius-md); border-left:3px solid var(--accent);">
        <h4 style="font-size:0.85rem; color:var(--accent); margin-bottom:0.5rem;">Analyse</h4>
        ${analysis.context ? `<p style="font-size:0.85rem; margin-bottom:0.4rem;"><strong>Kontext:</strong> ${this.escapeHTML(analysis.context)}</p>` : ''}
        ${analysis.significance ? `<p style="font-size:0.85rem; margin-bottom:0.4rem;"><strong>Bedeutung:</strong> ${this.escapeHTML(analysis.significance)}</p>` : ''}
        ${analysis.intervention_points ? `
          <div style="margin-top:0.5rem;">
            <strong style="font-size:0.85rem;">Interventionspunkte:</strong>
            <ul style="margin-top:0.25rem; padding-left:1.2rem;">
              ${analysis.intervention_points.map(p => `<li style="font-size:0.83rem; color:var(--text-secondary);">${this.escapeHTML(p)}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
      </div>
    ` : '';

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <div>
            <h2 style="font-size:1.1rem; margin-bottom:0.25rem;">${this.escapeHTML(evidence.title)}</h2>
            <div style="display:flex; gap:0.5rem; align-items:center;">
              <span class="badge badge-spur-${evidence.spur}">${AppState.getSpurName(evidence.spur)}</span>
              <span class="badge badge-type">${AppState.getTypeLabel(evidence.type)}</span>
              <span class="text-xs text-muted">${evidence.source} | ${evidence.date}</span>
              ${this.renderImportance(evidence.importance)}
            </div>
          </div>
          <button class="modal-close" id="evidence-modal-close">&times;</button>
        </div>
        <div class="modal-body">
          ${bodyHTML}
          ${tagsHTML}
          ${analysisHTML}
          <div style="margin-top:1.5rem; display:flex; gap:0.5rem;">
            <button class="btn btn-primary btn-sm" id="evidence-pin-btn">An Pinnwand heften</button>
            <button class="btn btn-secondary btn-sm" id="evidence-warnsignal-btn">Als Warnsignal markieren</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('modal-container').appendChild(modal);

    // Close handlers - button, overlay click and Escape key
    const closeModal = () => {
      modal.remove();
      document.removeEventListener('keydown', onKey);
    };
    const onKey = (e) => { if (e.key === 'Escape') closeModal(); };
    modal.querySelector('#evidence-modal-close').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', onKey);

    // Pin to board
    modal.querySelector('#evidence-pin-btn').addEventListener('click', async () => {
      try {
        await API.createBoardNote({
          title: evidence.title,
          content: `Quelle: ${evidence.source} | Datum: ${evidence.date}\n\n${typeof content === 'string' ? content.substring(0, 300) : evidence.title}`,
          columnName: 'timeline',
          tags: tags,
          evidenceLinks: [evidence.id]
        });
        Notifications.show('An Pinnwand geheftet!', 'success');
      } catch (err) {
        Notifications.show('Fehler: ' + err.message, 'warning');
      }
    });

    // Mark as warnsignal
    modal.querySelector('#evidence-warnsignal-btn').addEventListener('click', async () => {
      try {
        await API.createBoardNote({
          title: 'Warnsignal: ' + evidence.title,
          content: `Datum: ${evidence.date} | Quelle: ${evidence.source}`,
          columnName: 'warnsignale',
          tags: ['warnsignal', ...tags],
          evidenceLinks: [evidence.id]
        });
        Notifications.show('Als Warnsignal markiert!', 'success');
      } catch (err) {
        Notifications.show('Fehler: ' + err.message, 'warning');
      }
    });

    // Discover the evidence (server broadcasts to others via socket)
    API.discoverEvidence(evidence.id).catch(() => {});
  },

  renderImportance(level) {
    let dots = '';
    for (let i = 1; i <= 5; i++) {
      const filled = i <= level;
      const high = level >= 4 && filled;
      dots += `<span class="importance-dot ${filled ? 'filled' : ''} ${high ? 'high' : ''}"></span>`;
    }
    return `<span class="importance-dots">${dots}</span>`;
  },

  renderObject(obj) {
    let html = '<div style="display:flex; flex-direction:column; gap:0.5rem;">';
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'object' && value !== null) {
        html += `<div class="card"><strong style="font-size:0.85rem;">${this.escapeHTML(key)}:</strong>`;
        if (Array.isArray(value)) {
          html += '<ul style="padding-left:1rem; margin-top:0.25rem;">';
          value.forEach(v => { html += `<li style="font-size:0.85rem;">${this.renderArrayItem(v)}</li>`; });
          html += '</ul>';
        } else {
          html += `<pre style="font-size:0.8rem; margin-top:0.25rem; white-space:pre-wrap;">${this.escapeHTML(JSON.stringify(value, null, 2))}</pre>`;
        }
        html += '</div>';
      } else {
        html += `<div><strong style="font-size:0.85rem;">${this.escapeHTML(key)}:</strong> <span style="font-size:0.85rem;">${this.escapeHTML(String(value))}</span></div>`;
      }
    }
    html += '</div>';
    return html;
  },

  renderArrayItem(v) {
    if (v === null || v === undefined) return '';
    if (typeof v !== 'object') return this.escapeHTML(String(v));
    if (Array.isArray(v)) {
      if (v.length === 0) return '<em style="color:var(--text-secondary);">—</em>';
      return v.map(x => this.renderArrayItem(x)).join(', ');
    }
    const parts = Object.entries(v).map(([k, val]) => {
      let rendered;
      if (val === null || val === undefined || val === '') {
        rendered = '<em style="color:var(--text-secondary);">—</em>';
      } else if (Array.isArray(val)) {
        rendered = val.length === 0
          ? '<em style="color:var(--text-secondary);">—</em>'
          : val.map(x => typeof x === 'object' && x !== null ? this.renderArrayItem(x) : this.escapeHTML(String(x))).join(', ');
      } else if (typeof val === 'object') {
        rendered = this.renderArrayItem(val);
      } else {
        rendered = this.escapeHTML(String(val));
      }
      return `<strong>${this.escapeHTML(k)}:</strong> ${rendered}`;
    });
    return parts.join(' &middot; ');
  },

  escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
};
