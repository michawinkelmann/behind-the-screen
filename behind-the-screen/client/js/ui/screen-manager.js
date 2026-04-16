// Hash-based screen router
window.ScreenManager = {
  screens: ['investigation', 'board', 'modules', 'algorithm', 'admin'],

  init() {
    window.addEventListener('hashchange', () => this.route());

    // Nav link click handlers
    document.querySelectorAll('.nav-link[data-screen]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.hash = '#/' + link.dataset.screen;
      });
    });

    // Initial route
    this.route();
  },

  route() {
    const hash = window.location.hash.replace('#/', '') || 'investigation';
    const screen = this.screens.includes(hash) ? hash : 'investigation';
    this.show(screen);
  },

  show(screenName) {
    // Hide all screens
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));

    // Show target screen
    const target = document.getElementById('screen-' + screenName);
    if (target) target.classList.add('active');

    // Update nav active state
    document.querySelectorAll('.nav-link[data-screen]').forEach(link => {
      link.classList.toggle('active', link.dataset.screen === screenName);
    });

    AppState.set('currentScreen', screenName);

    // Trigger screen-specific init
    switch (screenName) {
      case 'investigation': InvestigationCentral.onShow(); break;
      case 'board': TeamBoard.onShow(); break;
      case 'modules': LearningHub.onShow(); break;
      case 'algorithm': AlgorithmLab.onShow(); break;
      case 'admin': AdminPanel.onShow(); break;
    }
  }
};
