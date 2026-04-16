const db = require('../config/database');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

const Team = {
  create(name, password, primarySpur) {
    const hash = bcrypt.hashSync(password, SALT_ROUNDS);
    const stmt = db.prepare(`
      INSERT INTO teams (name, password_hash, primary_spur)
      VALUES (?, ?, ?)
    `);
    const result = stmt.run(name, hash, primarySpur);

    // Create progress entry
    db.prepare('INSERT INTO progress (team_id) VALUES (?)').run(result.lastInsertRowid);

    return this.getById(result.lastInsertRowid);
  },

  authenticate(name, password) {
    const team = db.prepare('SELECT * FROM teams WHERE name = ?').get(name);
    if (!team) return null;
    if (!bcrypt.compareSync(password, team.password_hash)) return null;
    this.updateLastActive(team.id);
    return this.sanitize(team);
  },

  getById(id) {
    const team = db.prepare('SELECT * FROM teams WHERE id = ?').get(id);
    return team ? this.sanitize(team) : null;
  },

  getAll() {
    return db.prepare('SELECT id, name, primary_spur, created_at, last_active FROM teams').all();
  },

  getAllWithProgress() {
    return db.prepare(`
      SELECT t.id, t.name, t.primary_spur, t.last_active,
             p.evidence_found, p.notes_created, p.modules_completed,
             p.warnsignale_identified, p.connection_score
      FROM teams t
      LEFT JOIN progress p ON t.id = p.team_id
    `).all();
  },

  updateLastActive(id) {
    db.prepare('UPDATE teams SET last_active = CURRENT_TIMESTAMP WHERE id = ?').run(id);
  },

  sanitize(team) {
    const { password_hash, ...safe } = team;
    return safe;
  }
};

module.exports = Team;
