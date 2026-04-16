// Chat protocol renderer for evidence display
window.ChatViewer = {
  // Color map for usernames
  _colors: {},
  _colorPalette: ['#9b59b6', '#e74c3c', '#3498db', '#e91e63', '#ff9500', '#27ae60', '#00bcd4', '#ff5722'],
  _colorIdx: 0,

  getColor(username) {
    if (!this._colors[username]) {
      this._colors[username] = this._colorPalette[this._colorIdx % this._colorPalette.length];
      this._colorIdx++;
    }
    return this._colors[username];
  },

  render(messages) {
    if (!Array.isArray(messages) || messages.length === 0) {
      return '<div class="text-muted text-sm">Keine Nachrichten vorhanden.</div>';
    }

    let html = '<div class="chat-thread">';
    for (const msg of messages) {
      const color = this.getColor(msg.username || msg.user || 'Unbekannt');
      const username = msg.username || msg.user || 'Unbekannt';
      const sentiment = msg.sentiment || 'neutral';
      const timestamp = msg.timestamp || msg.time || '';
      const text = msg.message || msg.text || msg.content || '';
      const initial = username.charAt(0).toUpperCase();

      html += `
        <div class="chat-message sentiment-${sentiment}">
          <div class="chat-avatar" style="background:${color}">${this.escapeHTML(initial)}</div>
          <div class="chat-message-body">
            <div class="chat-message-header">
              <span class="chat-username" style="color:${color}">${this.escapeHTML(username)}</span>
              <span class="chat-timestamp">${this.escapeHTML(timestamp)}</span>
            </div>
            <div class="chat-text">${this.escapeHTML(text)}</div>
          </div>
        </div>
      `;
    }
    html += '</div>';
    return html;
  },

  escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
};
