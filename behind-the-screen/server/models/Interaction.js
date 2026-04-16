const db = require('../config/database');

const Interaction = {
  log(teamId, actionType, actionData = {}) {
    db.prepare(`
      INSERT INTO interactions (team_id, action_type, action_data)
      VALUES (?, ?, ?)
    `).run(teamId, actionType, JSON.stringify(actionData));
  },

  getByTeam(teamId, limit = 50) {
    return db.prepare(`
      SELECT * FROM interactions WHERE team_id = ?
      ORDER BY timestamp DESC LIMIT ?
    `).all(teamId, limit);
  },

  getRecent(limit = 100) {
    return db.prepare(`
      SELECT i.*, t.name as team_name
      FROM interactions i
      JOIN teams t ON i.team_id = t.id
      ORDER BY i.timestamp DESC LIMIT ?
    `).all(limit);
  },

  getTeamActivity(minutes = 10) {
    return db.prepare(`
      SELECT t.id, t.name, COUNT(i.id) as action_count, MAX(i.timestamp) as last_action
      FROM teams t
      LEFT JOIN interactions i ON t.id = i.team_id
        AND i.timestamp > datetime('now', '-' || ? || ' minutes')
      GROUP BY t.id
    `).all(minutes);
  }
};

module.exports = Interaction;
