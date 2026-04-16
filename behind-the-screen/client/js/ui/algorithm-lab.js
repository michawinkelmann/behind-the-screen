// Algorithm simulator / visualization
window.AlgorithmLab = {
  _initialized: false,

  onShow() {
    if (!this._initialized) {
      this.render();
      this._initialized = true;
    }
  },

  render() {
    const container = document.getElementById('algorithm-container');

    container.innerHTML = `
      <div style="max-width:800px; margin:0 auto;">
        <h2 style="font-size:1.3rem; margin-bottom:0.5rem;">Algorithmus-Labor</h2>
        <p class="text-muted mb-2">Verstehe, wie Empfehlungsalgorithmen Max' Feed ueber die Zeit veraendert haben.</p>

        <!-- Feed Composition Over Time -->
        <div class="card mb-2">
          <h3 style="font-size:1rem; margin-bottom:1rem; color:var(--accent);">Feed-Zusammensetzung ueber Zeit</h3>
          <div style="display:flex; align-items:center; gap:1rem; margin-bottom:0.75rem;">
            <label class="text-sm" style="flex-shrink:0;">Zeitraum:</label>
            <input type="range" id="algo-timeline" min="0" max="5" value="0" style="flex:1; border:none; padding:0; min-height:auto;">
            <span id="algo-month-label" class="text-sm" style="min-width:100px;">Nov 2023</span>
          </div>
          <div id="algo-feed-chart" class="feed-chart"></div>
          <div id="algo-feed-legend" style="display:flex; flex-wrap:wrap; gap:0.75rem; margin-top:0.5rem; font-size:0.75rem;"></div>
        </div>

        <!-- Rabbit Hole Simulation -->
        <div class="card mb-2">
          <h3 style="font-size:1rem; margin-bottom:0.5rem; color:var(--accent);">Rabbit-Hole-Simulation</h3>
          <p class="text-sm text-muted mb-1">Klicke auf ein Video, um zu sehen, was der Algorithmus als naechstes empfiehlt.</p>
          <div id="rabbit-hole-container"></div>
        </div>

        <!-- Key Insight -->
        <div class="card" style="border-left:3px solid var(--warning);">
          <h3 style="font-size:0.95rem; margin-bottom:0.5rem; color:var(--warning);">Wichtige Erkenntnis</h3>
          <p style="font-size:0.9rem; line-height:1.6;">
            Algorithmen optimieren auf <strong>Engagement</strong>, nicht auf Wahrheit oder Wohlbefinden.
            Emotionale, polarisierende Inhalte erzeugen mehr Klicks, Likes und Verweildauer.
            Das bedeutet: Der Algorithmus ist nicht "boese" - er ist optimiert fuer ein Ziel,
            das unbeabsichtigte Konsequenzen hat. Max' Feed wurde immer extremer,
            weil extreme Inhalte mehr Engagement erzeugten.
          </p>
        </div>
      </div>
    `;

    this.initFeedChart();
    this.initRabbitHole();
  },

  feedData: [
    { month: 'Nov 2023', categories: { 'Gaming': 40, 'Musik/Tanz': 30, 'Memes': 15, 'Zufaellig': 10, 'Freunde': 5 } },
    { month: 'Maerz 2024', categories: { 'Gaming': 35, 'Gaming+Kultur': 20, 'Musik/Tanz': 15, 'Politik/Philosophie': 12, 'Competitive': 10, 'Sonstiges': 8 } },
    { month: 'Juni 2024', categories: { 'Gaming': 25, 'Politik/Ideologie': 25, 'Gaming+Kultur': 20, 'Maennlichkeit': 15, 'Philosophie': 10, 'Sonstiges': 5 } },
    { month: 'Aug 2024', categories: { 'Politik/Verschwoerung': 45, 'Gaming (politisch)': 25, 'Philosophie (ideologisch)': 15, 'Extreme Inhalte': 10, 'Sonstiges': 5 } },
    { month: 'Nov 2024', categories: { 'Radikale Politik': 50, 'Ideologische Videos': 20, 'Gaming (radikal)': 15, 'Verschwoerung': 10, 'Sonstiges': 5 } },
    { month: 'Feb 2025', categories: { 'Radikale Ideologie': 55, 'Verschwoerung': 20, 'Rekrutierung': 10, 'Gaming (Szene)': 10, 'Sonstiges': 5 } }
  ],

  categoryColors: {
    'Gaming': '#3498db', 'Gaming+Kultur': '#2980b9', 'Gaming (politisch)': '#1a5276', 'Gaming (radikal)': '#154360', 'Gaming (Szene)': '#0e2f44',
    'Musik/Tanz': '#27ae60', 'Memes': '#f39c12', 'Zufaellig': '#95a5a6', 'Freunde': '#1abc9c',
    'Competitive': '#8e44ad', 'Sonstiges': '#7f8c8d',
    'Politik/Philosophie': '#e67e22', 'Politik/Ideologie': '#d35400', 'Politik/Verschwoerung': '#c0392b',
    'Maennlichkeit': '#e74c3c', 'Philosophie': '#9b59b6', 'Philosophie (ideologisch)': '#6c3483',
    'Extreme Inhalte': '#922b21', 'Radikale Politik': '#78281f', 'Radikale Ideologie': '#641e16',
    'Ideologische Videos': '#7b241c', 'Verschwoerung': '#b03a2e', 'Rekrutierung': '#943126'
  },

  initFeedChart() {
    const slider = document.getElementById('algo-timeline');
    slider.addEventListener('input', () => this.updateFeedChart(parseInt(slider.value)));
    this.updateFeedChart(0);
  },

  updateFeedChart(index) {
    const data = this.feedData[index];
    document.getElementById('algo-month-label').textContent = data.month;

    const chartEl = document.getElementById('algo-feed-chart');
    const legendEl = document.getElementById('algo-feed-legend');

    const entries = Object.entries(data.categories);
    const maxVal = Math.max(...entries.map(([, v]) => v));

    chartEl.innerHTML = entries.map(([cat, val]) => {
      const height = (val / maxVal) * 100;
      const color = this.categoryColors[cat] || '#7f8c8d';
      return `<div class="feed-bar" style="height:${height}%; background:${color};" title="${cat}: ${val}%"></div>`;
    }).join('');

    legendEl.innerHTML = entries.map(([cat, val]) => {
      const color = this.categoryColors[cat] || '#7f8c8d';
      return `<span style="display:flex; align-items:center; gap:4px;">
        <span style="width:10px; height:10px; border-radius:2px; background:${color};"></span>
        ${cat} (${val}%)
      </span>`;
    }).join('');
  },

  rabbitHoleSteps: [
    { title: 'Lustige Gaming-Fails', views: '500K', type: 'harmlos', next: 1 },
    { title: 'Pro-Gaming Tipps & Tricks', views: '200K', type: 'harmlos', next: 2 },
    { title: 'Warum Gaming-Studios versagen', views: '150K', type: 'grenzwertig', next: 3 },
    { title: 'Die Wahrheit ueber Diversity in Games', views: '80K', type: 'problematisch', next: 4 },
    { title: 'Maennlichkeit unter Angriff', views: '120K', type: 'radikal', next: 5 },
    { title: 'Was sie dir verschweigen...', views: '250K', type: 'extrem', next: null }
  ],

  initRabbitHole() {
    this.renderRabbitHoleStep(0, []);
  },

  renderRabbitHoleStep(stepIdx, history) {
    const container = document.getElementById('rabbit-hole-container');
    const step = this.rabbitHoleSteps[stepIdx];
    if (!step) return;

    const typeColors = {
      'harmlos': 'var(--success)', 'grenzwertig': 'var(--orange)',
      'problematisch': '#e74c3c', 'radikal': '#c0392b', 'extrem': '#78281f'
    };

    let historyHTML = history.map((h, i) => `
      <div style="display:flex; align-items:center; gap:0.5rem; padding:0.3rem 0; opacity:${0.4 + (i / history.length) * 0.6};">
        <span style="color:var(--text-muted);">&#8594;</span>
        <span style="font-size:0.83rem;">${this.escapeHTML(h.title)}</span>
        <span class="badge" style="background:${typeColors[h.type]}20; color:${typeColors[h.type]}; font-size:0.65rem;">${h.type}</span>
      </div>
    `).join('');

    container.innerHTML = `
      ${historyHTML}
      <div class="card" style="margin-top:0.5rem; border-left:3px solid ${typeColors[step.type]}; cursor:${step.next !== null ? 'pointer' : 'default'};" id="rabbit-hole-current">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <div style="font-weight:600; font-size:0.95rem;">${this.escapeHTML(step.title)}</div>
            <div class="text-xs text-muted">${step.views} Views</div>
          </div>
          <span class="badge" style="background:${typeColors[step.type]}20; color:${typeColors[step.type]};">${step.type}</span>
        </div>
        ${step.next !== null ? '<div class="text-xs text-muted mt-1">&#8594; Klicke um zu sehen, was der Algorithmus als naechstes empfiehlt</div>' : '<div class="text-xs mt-1" style="color:var(--warning);">Ende des Rabbit Holes - Max ist in einer Echokammer.</div>'}
      </div>
      ${history.length > 0 ? '<button class="btn btn-secondary btn-sm mt-1" id="rabbit-hole-reset">Zuruecksetzen</button>' : ''}
    `;

    if (step.next !== null) {
      container.querySelector('#rabbit-hole-current').addEventListener('click', () => {
        this.renderRabbitHoleStep(step.next, [...history, step]);
      });
    }

    const resetBtn = container.querySelector('#rabbit-hole-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.renderRabbitHoleStep(0, []));
    }
  },

  escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }
};
