const express = require('express');
const db = require('../config/database');
const Team = require('../models/Team');
const Evidence = require('../models/Evidence');
const Progress = require('../models/Progress');
const Interaction = require('../models/Interaction');
const { adminMiddleware } = require('./auth');

const router = express.Router();

// All admin routes require admin auth
router.use(adminMiddleware);

// GET /api/admin/gamestate
router.get('/gamestate', (req, res) => {
  const gameState = db.prepare('SELECT * FROM game_state WHERE id = 1').get();
  const teams = Team.getAllWithProgress();
  const evidenceStats = Evidence.getDiscoveryStats();
  res.json({ gameState, teams, evidenceStats });
});

// POST /api/admin/pause
router.post('/pause', (req, res) => {
  db.prepare('UPDATE game_state SET is_paused = 1 WHERE id = 1').run();
  const gameState = db.prepare('SELECT * FROM game_state WHERE id = 1').get();
  req.app.get('io').emit('game:paused', { message: req.body.message || 'Spiel pausiert' });
  res.json({ gameState });
});

// POST /api/admin/resume
router.post('/resume', (req, res) => {
  db.prepare('UPDATE game_state SET is_paused = 0 WHERE id = 1').run();
  const gameState = db.prepare('SELECT * FROM game_state WHERE id = 1').get();
  req.app.get('io').emit('game:resumed', {});
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
  res.json({ gameState });
});

// POST /api/admin/set-day
router.post('/set-day', (req, res) => {
  const { day } = req.body;
  if (day < 1 || day > 3) return res.status(400).json({ error: 'Tag muss 1-3 sein' });

  db.prepare('UPDATE game_state SET current_day = ?, current_phase = 1, phase_start_time = datetime(\'now\') WHERE id = 1')
    .run(day);

  const gameState = db.prepare('SELECT * FROM game_state WHERE id = 1').get();
  req.app.get('io').emit('game:phase-changed', { gameState });
  res.json({ gameState });
});

// POST /api/admin/broadcast
router.post('/broadcast', (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Nachricht erforderlich' });

  db.prepare('UPDATE game_state SET teacher_message = ? WHERE id = 1').run(message);
  req.app.get('io').emit('admin:broadcast', { message, timestamp: new Date().toISOString() });
  res.json({ success: true });
});

// GET /api/admin/activity
router.get('/activity', (req, res) => {
  const recent = Interaction.getRecent(100);
  const teamActivity = Interaction.getTeamActivity(10);
  res.json({ recent, teamActivity });
});

// GET /api/admin/export
router.get('/export', (req, res) => {
  const gameState = db.prepare('SELECT * FROM game_state WHERE id = 1').get();
  const teams = Team.getAllWithProgress();
  const notes = db.prepare('SELECT * FROM board_notes').all();
  const comments = db.prepare('SELECT * FROM board_comments').all();
  const discovered = db.prepare('SELECT * FROM evidence WHERE is_discovered = 1').all();
  const interactions = db.prepare('SELECT * FROM interactions ORDER BY timestamp DESC LIMIT 1000').all();

  res.json({
    exportDate: new Date().toISOString(),
    gameState, teams, notes, comments,
    discoveredEvidence: discovered,
    recentInteractions: interactions
  });
});

// POST /api/admin/reset
router.post('/reset', (req, res) => {
  db.prepare('DELETE FROM board_comments').run();
  db.prepare('DELETE FROM board_notes').run();
  db.prepare('DELETE FROM interactions').run();
  Evidence.resetDiscoveries();
  Progress.resetAll();
  db.prepare('UPDATE game_state SET current_day = 1, current_phase = 1, is_paused = 0, teacher_message = \'\' WHERE id = 1').run();

  req.app.get('io').emit('game:reset', {});
  res.json({ success: true });
});

module.exports = router;
