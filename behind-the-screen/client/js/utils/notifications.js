// Toast notification system with simple de-duplication
window.Notifications = {
  _recent: new Map(),

  show(message, type = 'info', duration = 4000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    // Suppress identical toasts within 1.2s (e.g. rapid socket events)
    const key = `${type}|${message}`;
    const now = Date.now();
    const last = this._recent.get(key) || 0;
    if (now - last < 1200) return;
    this._recent.set(key, now);
    if (this._recent.size > 100) {
      // cheap cleanup so the map doesn't grow forever
      for (const [k, t] of this._recent) if (now - t > 10_000) this._recent.delete(k);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', type === 'warning' ? 'alert' : 'status');
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('toast-out');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
};
