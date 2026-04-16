const db = require('../config/database');

const Progress = {
  getByTeamId(teamId) {
    return db.prepare('SELECT * FROM progress WHERE team_id = ?').get(teamId);
  },

  getAll() {
    return db.prepare(`
      SELECT p.*, t.name as team_name, t.primary_spur
      FROM progress p
      JOIN teams t ON p.team_id = t.id
    `).all();
  },

  completeModule(teamId, moduleId) {
    const progress = this.getByTeamId(teamId);
    if (!progress) return null;

    const completed = JSON.parse(progress.modules_completed || '[]');
    if (!completed.includes(moduleId)) {
      completed.push(moduleId);
      db.prepare('UPDATE progress SET modules_completed = ? WHERE team_id = ?')
        .run(JSON.stringify(completed), teamId);
    }
    return this.getByTeamId(teamId);
  },

  incrementWarnsignale(teamId) {
    db.prepare('UPDATE progress SET warnsignale_identified = warnsignale_identified + 1 WHERE team_id = ?')
      .run(teamId);
    return this.getByTeamId(teamId);
  },

  updateConnectionScore(teamId, score) {
    db.prepare('UPDATE progress SET connection_score = ? WHERE team_id = ?')
      .run(score, teamId);
  },

  resetAll() {
    db.prepare('UPDATE progress SET evidence_found = 0, notes_created = 0, modules_completed = \'[]\', warnsignale_identified = 0, connection_score = 0.0').run();
  }
};

module.exports = Progress;
