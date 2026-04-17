const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'db', 'game.db');
const db = new Database(dbPath);

// WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Ensure all schema tables exist. init.sql uses `CREATE TABLE IF NOT EXISTS`
// everywhere, so running it on every boot is safe and lets new extensions add
// tables without a manual re-seed.
try {
  const schema = fs.readFileSync(path.join(__dirname, '..', 'db', 'init.sql'), 'utf8');
  db.exec(schema);
} catch (e) {
  console.error('[db] Schema-Init fehlgeschlagen:', e.message);
}

module.exports = db;
