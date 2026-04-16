const express = require('express');
const Evidence = require('../models/Evidence');
const Interaction = require('../models/Interaction');
const { authMiddleware } = require('./auth');

const router = express.Router();

// GET /api/evidence/search
router.get('/search', authMiddleware, (req, res) => {
  const { q, spur, type, source, dateFrom, dateTo, importance, limit, offset } = req.query;

  // Get current game day for filtering
  const db = require('../config/database');
  const gameState = db.prepare('SELECT current_day FROM game_state WHERE id = 1').get();

  const results = Evidence.search({
    q, spur, type, source, dateFrom, dateTo,
    importance: importance ? parseInt(importance) : undefined,
    dayAvailable: gameState ? gameState.current_day : 1,
    limit: limit ? parseInt(limit) : 50,
    offset: offset ? parseInt(offset) : 0
  });

  Interaction.log(req.team.id, 'evidence_search', { q, spur, type, resultCount: results.length });

  res.json({ results, count: results.length });
});

// GET /api/evidence/stats
router.get('/stats', authMiddleware, (req, res) => {
  const db = require('../config/database');
  const gameState = db.prepare('SELECT current_day FROM game_state WHERE id = 1').get();
  const stats = Evidence.getSpurStats(gameState ? gameState.current_day : 1);
  res.json({ stats });
});

// GET /api/evidence/filters
router.get('/filters', authMiddleware, (req, res) => {
  const types = Evidence.getTypes();
  const sources = Evidence.getSources();
  res.json({ types, sources });
});

// GET /api/evidence/:id
router.get('/:id', authMiddleware, (req, res) => {
  const evidence = Evidence.getById(req.params.id);
  if (!evidence) {
    return res.status(404).json({ error: 'Beweis nicht gefunden' });
  }
  Interaction.log(req.team.id, 'evidence_view', { evidenceId: req.params.id });
  res.json({ evidence });
});

// POST /api/evidence/:id/discover
router.post('/:id/discover', authMiddleware, (req, res) => {
  const evidence = Evidence.discover(req.params.id, req.team.id);
  if (!evidence) {
    return res.status(404).json({ error: 'Beweis nicht gefunden' });
  }
  Interaction.log(req.team.id, 'evidence_discover', { evidenceId: req.params.id });
  res.json({ evidence });
});

module.exports = router;
