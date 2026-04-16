const db = require('./database');

const GameLogic = {
  getState() {
    return db.prepare('SELECT * FROM game_state WHERE id = 1').get();
  },

  getPhaseName(phase) {
    const names = {
      1: 'Ermittlung',
      2: 'Verknuepfungen',
      3: 'Synthese'
    };
    return names[phase] || 'Unbekannt';
  },

  getDayName(day) {
    const names = {
      1: 'Der Fall',
      2: 'Die Mechanismen',
      3: 'Die Loesung'
    };
    return names[day] || 'Unbekannt';
  },

  getPhaseInfo() {
    const state = this.getState();
    return {
      ...state,
      dayName: this.getDayName(state.current_day),
      phaseName: this.getPhaseName(state.current_phase),
      remainingMinutes: this.getRemainingMinutes(state)
    };
  },

  getRemainingMinutes(state) {
    if (!state.phase_start_time || state.is_paused) return state.phase_duration_minutes;
    const started = new Date(state.phase_start_time).getTime();
    const elapsed = (Date.now() - started) / 60000;
    return Math.max(0, state.phase_duration_minutes - elapsed);
  }
};

module.exports = GameLogic;
