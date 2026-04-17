const express = require('express');
const db = require('../config/database');
const Team = require('../models/Team');
const Evidence = require('../models/Evidence');
const Progress = require('../models/Progress');
const Interaction = require('../models/Interaction');
const AuditLog = require('../models/AuditLog');
const Presence = require('../models/Presence');
const Session = require('../models/Session');
const Export = require('../utils/export-markdown');
const { adminMiddleware } = require('./auth');

const router = express.Router();

const BROADCAST_MAX_LEN = 500;
const PAUSE_MSG_MAX_LEN = 200;

router.use(adminMiddleware);

function audit(req, action, details = {}) {
  try { AuditLog.record(action, details, req.ip || ''); } catch (e) {}
}

// GET /api/admin/gamestate
router.get('/gamestate', (req, res) => {
  const gameState = db.prepare('SELECT * FROM game_state WHERE id = 1').get();
  const teams = Team.getAllWithProgress();
  const evidenceStats = Evidence.getDiscoveryStats();
  res.json({ gameState, teams, evidenceStats });
});

// POST /api/admin/pause
router.post('/pause', (req, res) => {
  const message = typeof req.body.message === 'string'
    ? req.body.message.slice(0, PAUSE_MSG_MAX_LEN)
    : 'Spiel pausiert';
  db.prepare('UPDATE game_state SET is_paused = 1 WHERE id = 1').run();
  const gameState = db.prepare('SELECT * FROM game_state WHERE id = 1').get();
  req.app.get('io').emit('game:paused', { message });
  audit(req, 'game.pause', { message });
  res.json({ gameState });
});

// POST /api/admin/resume
router.post('/resume', (req, res) => {
  db.prepare('UPDATE game_state SET is_paused = 0 WHERE id = 1').run();
  const gameState = db.prepare('SELECT * FROM game_state WHERE id = 1').get();
  req.app.get('io').emit('game:resumed', {});
  audit(req, 'game.resume');
  res.json({ gameState });
});

// POST /api/admin/advance-phase
router.post('/advance-phase', (req, res) => {
  const current = db.prepare('SELECT * FROM game_state WHERE id = 1').get();
  let newPhase = current.current_phase + 1;
  let newDay = current.current_day;

  if (newPhase > 3) {
    newPhase = 1;
    newDay = Math.min(newDay + 1, 3);
  }

  db.prepare(`
    UPDATE game_state SET current_phase = ?, current_day = ?,
    phase_start_time = datetime('now'), is_paused = 0 WHERE id = 1
  `).run(newPhase, newDay);

  const gameState = db.prepare('SELECT * FROM game_state WHERE id = 1').get();
  req.app.get('io').emit('game:phase-changed', { gameState });
  audit(req, 'game.advance-phase', { from: { day: current.current_day, phase: current.current_phase }, to: { day: newDay, phase: newPhase } });
  res.json({ gameState });
});

// POST /api/admin/set-day
router.post('/set-day', (req, res) => {
  const day = Number.parseInt(req.body && req.body.day, 10);
  if (!Number.isInteger(day) || day < 1 || day > 3) {
    return res.status(400).json({ error: 'Tag muss 1-3 sein' });
  }

  db.prepare(
    "UPDATE game_state SET current_day = ?, current_phase = 1, phase_start_time = datetime('now'), is_paused = 0 WHERE id = 1"
  ).run(day);

  const gameState = db.prepare('SELECT * FROM game_state WHERE id = 1').get();
  req.app.get('io').emit('game:phase-changed', { gameState });
  audit(req, 'game.set-day', { day });
  res.json({ gameState });
});

// POST /api/admin/broadcast
router.post('/broadcast', (req, res) => {
  const raw = req.body && req.body.message;
  if (typeof raw !== 'string' || !raw.trim()) {
    return res.status(400).json({ error: 'Nachricht erforderlich' });
  }
  const message = raw.trim().slice(0, BROADCAST_MAX_LEN);

  db.prepare('UPDATE game_state SET teacher_message = ? WHERE id = 1').run(message);
  req.app.get('io').emit('admin:broadcast', { message, timestamp: new Date().toISOString() });
  audit(req, 'admin.broadcast', { message });
  res.json({ success: true });
});

// POST /api/admin/clear-broadcast
router.post('/clear-broadcast', (req, res) => {
  db.prepare("UPDATE game_state SET teacher_message = '' WHERE id = 1").run();
  req.app.get('io').emit('admin:broadcast-cleared', {});
  audit(req, 'admin.clear-broadcast');
  res.json({ success: true });
});

// POST /api/admin/set-duration
router.post('/set-duration', (req, res) => {
  const minutes = Number.parseInt(req.body && req.body.minutes, 10);
  if (!Number.isInteger(minutes) || minutes < 1 || minutes > 240) {
    return res.status(400).json({ error: 'Dauer muss 1-240 Minuten sein' });
  }
  db.prepare('UPDATE game_state SET phase_duration_minutes = ? WHERE id = 1').run(minutes);
  const gameState = db.prepare('SELECT * FROM game_state WHERE id = 1').get();
  req.app.get('io').emit('game:phase-changed', { gameState });
  audit(req, 'game.set-duration', { minutes });
  res.json({ gameState });
});

// GET /api/admin/activity
router.get('/activity', (req, res) => {
  const recent = Interaction.getRecent(100);
  const teamActivity = Interaction.getTeamActivity(10);
  res.json({ recent, teamActivity });
});

// GET /api/admin/presence - live socket-derived presence for each team
router.get('/presence', (req, res) => {
  res.json({ presence: Presence.snapshot() });
});

// GET /api/admin/heatmap?minutes=60&bucket=5 - activity heatmap per team
router.get('/heatmap', (req, res) => {
  const minutes = Math.max(5, Math.min(360, Number.parseInt(req.query.minutes, 10) || 60));
  const bucket = Math.max(1, Math.min(30, Number.parseInt(req.query.bucket, 10) || 5));
  res.json(Presence.heatmap(minutes, bucket));
});

// GET /api/admin/audit - paginated audit log
router.get('/audit', (req, res) => {
  const limit = Math.max(1, Math.min(500, Number.parseInt(req.query.limit, 10) || 100));
  const offset = Math.max(0, Number.parseInt(req.query.offset, 10) || 0);
  res.json({ entries: AuditLog.list(limit, offset), total: AuditLog.count() });
});

// GET /api/admin/export (JSON)
router.get('/export', (req, res) => {
  const gameState = db.prepare('SELECT * FROM game_state WHERE id = 1').get();
  const teams = Team.getAllWithProgress();
  const notes = db.prepare('SELECT * FROM board_notes ORDER BY created_at DESC LIMIT 5000').all();
  const comments = db.prepare('SELECT * FROM board_comments ORDER BY created_at DESC LIMIT 10000').all();
  const discovered = db.prepare('SELECT id, title, spur, type, importance, discovered_by, discovered_at FROM evidence WHERE is_discovered = 1').all();
  const interactions = db.prepare('SELECT * FROM interactions ORDER BY timestamp DESC LIMIT 2000').all();

  res.setHeader('Content-Disposition', 'attachment; filename="behind-the-screen-export.json"');
  audit(req, 'admin.export', { format: 'json' });
  res.json({
    exportDate: new Date().toISOString(),
    gameState, teams, notes, comments,
    discoveredEvidence: discovered,
    recentInteractions: interactions
  });
});

// GET /api/admin/export/markdown - human-readable classroom debrief
router.get('/export/markdown', (req, res) => {
  const md = Export.buildMarkdownExport();
  res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="behind-the-screen-export.md"');
  audit(req, 'admin.export', { format: 'markdown' });
  res.send(md);
});

// POST /api/admin/reset
router.post('/reset', (req, res) => {
  const reset = db.transaction(() => {
    db.prepare('DELETE FROM board_comments').run();
    db.prepare('DELETE FROM board_notes').run();
    db.prepare('DELETE FROM interactions').run();
    Evidence.resetDiscoveries();
    Progress.resetAll();
    Session.destroyAll();
    db.prepare(
      "UPDATE game_state SET current_day = 1, current_phase = 1, is_paused = 0, teacher_message = '', phase_start_time = datetime('now') WHERE id = 1"
    ).run();
  });
  reset();

  req.app.get('io').emit('game:reset', {});
  audit(req, 'admin.reset');
  res.json({ success: true });
});

module.exports = router;
