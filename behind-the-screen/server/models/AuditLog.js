const db = require('../config/database');

function record(action, details = {}, ip = '') {
  if (typeof action !== 'string' || !action) return;
  let json = '{}';
  try { json = JSON.stringify(details || {}); } catch (_) { json = '{}'; }
  db.prepare(
    `INSERT INTO admin_audit_log (actor, action, details, ip) VALUES (?, ?, ?, ?)`
  ).run('admin', action.slice(0, 80), json.slice(0, 4000), String(ip || '').slice(0, 64));
}

function list(limit = 100, offset = 0) {
  return db.prepare(
    `SELECT id, actor, action, details, ip, created_at FROM admin_audit_log
     ORDER BY id DESC LIMIT ? OFFSET ?`
  ).all(limit, offset);
}

function count() {
  return db.prepare(`SELECT COUNT(*) AS c FROM admin_audit_log`).get().c;
}

module.exports = { record, list, count };
