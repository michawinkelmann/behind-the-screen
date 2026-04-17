const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function createForTeam(teamId) {
  const token = uuidv4();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();
  db.prepare(
    `INSERT INTO sessions (token, team_id, expires_at) VALUES (?, ?, ?)`
  ).run(token, teamId, expiresAt);
  return token;
}

function getTeam(token) {
  if (!token || typeof token !== 'string') return null;
  const row = db.prepare(`
    SELECT s.expires_at, t.id, t.name, t.primary_spur
    FROM sessions s
    JOIN teams t ON t.id = s.team_id
    WHERE s.token = ?
  `).get(token);
  if (!row) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) {
    destroy(token);
    return null;
  }
  db.prepare(`UPDATE sessions SET last_used = CURRENT_TIMESTAMP WHERE token = ?`).run(token);
  return { id: row.id, name: row.name, primary_spur: row.primary_spur };
}

function destroy(token) {
  if (!token) return;
  db.prepare(`DELETE FROM sessions WHERE token = ?`).run(token);
}

function destroyForTeam(teamId) {
  db.prepare(`DELETE FROM sessions WHERE team_id = ?`).run(teamId);
}

function destroyAll() {
  db.prepare(`DELETE FROM sessions`).run();
}

function pruneExpired() {
  return db.prepare(`DELETE FROM sessions WHERE expires_at < CURRENT_TIMESTAMP`).run().changes;
}

module.exports = {
  createForTeam,
  getTeam,
  destroy,
  destroyForTeam,
  destroyAll,
  pruneExpired,
  SESSION_DURATION_MS
};
