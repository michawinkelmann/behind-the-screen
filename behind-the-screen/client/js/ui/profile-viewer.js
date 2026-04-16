// Social media profile renderer
window.ProfileViewer = {
  render(content, evidence) {
    const platform = content.platform || evidence.source || '';
    const username = content.username || '';
    const bio = content.bio || '';
    const followers = content.followers || 0;
    const following = content.following || 0;
    const posts = content.posts || content.videos || [];
    const profileDate = content.snapshot_date || evidence.date || '';
    const color = AppState.getSpurColor(evidence.spur);

    let html = `
      <div class="profile-header">
        <div class="profile-avatar-large" style="background:${color}">
          ${this.escapeHTML((username || 'M').charAt(0).toUpperCase())}
        </div>
        <div class="profile-info">
          <h2>${this.escapeHTML(username)}</h2>
          <div class="text-sm text-muted">${this.escapeHTML(platform)} | Stand: ${this.escapeHTML(profileDate)}</div>
          <div style="margin-top:0.5rem; font-size:0.9rem;">${this.escapeHTML(bio)}</div>
          <div class="profile-stats">
            <div class="profile-stat">
              <div class="profile-stat-value">${this.formatNumber(followers)}</div>
              <div class="profile-stat-label">Follower</div>
            </div>
            <div class="profile-stat">
              <div class="profile-stat-value">${this.formatNumber(following)}</div>
              <div class="profile-stat-label">Following</div>
            </div>
            ${content.likes !== undefined ? `
              <div class="profile-stat">
                <div class="profile-stat-value">${this.formatNumber(content.likes)}</div>
                <div class="profile-stat-label">Likes</div>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;

    // Following list changes
    if (content.following_accounts) {
      html += `
        <div class="card mb-1">
          <h4 style="font-size:0.85rem; margin-bottom:0.5rem;">Folgt diesen Accounts:</h4>
          <div style="display:flex; flex-wrap:wrap; gap:0.3rem;">
            ${content.following_accounts.map(a => {
              const suspicious = a.suspicious || a.radical || false;
              return `<span class="badge ${suspicious ? 'badge-importance-5' : 'badge-type'}">${this.escapeHTML(typeof a === 'string' ? a : a.name || a.username)}</span>`;
            }).join('')}
          </div>
        </div>
      `;
    }

    // Posts / Videos
    if (posts.length > 0) {
      html += `
        <div style="margin-top:1rem;">
          <h4 style="font-size:0.85rem; margin-bottom:0.5rem;">Posts / Videos:</h4>
          <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap:0.5rem;">
            ${posts.map(p => this.renderPost(p)).join('')}
          </div>
        </div>
      `;
    }

    // Bio changes over time
    if (content.bio_history) {
      html += `
        <div class="card" style="margin-top:1rem;">
          <h4 style="font-size:0.85rem; margin-bottom:0.5rem;">Bio-Veraenderungen:</h4>
          ${content.bio_history.map(b => `
            <div style="display:flex; gap:0.5rem; margin-bottom:0.4rem; font-size:0.85rem;">
              <span class="text-muted" style="flex-shrink:0; width:80px;">${this.escapeHTML(b.date)}</span>
              <span>${this.escapeHTML(b.bio)}</span>
            </div>
          `).join('')}
        </div>
      `;
    }

    return html;
  },

  renderPost(post) {
    const title = post.title || post.caption || 'Untitled';
    const views = post.views || 0;
    const likes = post.likes || 0;
    const comments = post.comments || post.comment_count || 0;
    const date = post.date || '';

    return `
      <div class="card" style="padding:0.6rem;">
        <div style="font-size:0.83rem; font-weight:600; margin-bottom:0.3rem; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">
          ${this.escapeHTML(title)}
        </div>
        <div style="font-size:0.75rem; color:var(--text-muted); margin-bottom:0.3rem;">${this.escapeHTML(date)}</div>
        <div style="display:flex; gap:0.75rem; font-size:0.75rem; color:var(--text-secondary);">
          <span>${this.formatNumber(views)} Views</span>
          <span>${this.formatNumber(likes)} Likes</span>
          <span>${this.formatNumber(comments)} Komm.</span>
        </div>
      </div>
    `;
  },

  formatNumber(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return String(n);
  },

  escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }
};
