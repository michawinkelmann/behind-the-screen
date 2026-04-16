const express = require('express');
const fs = require('fs');
const path = require('path');
const Progress = require('../models/Progress');
const Interaction = require('../models/Interaction');
const { authMiddleware } = require('./auth');

const router = express.Router();

const modulesDir = path.join(__dirname, '..', 'data', 'modules');

function loadModules() {
  if (!fs.existsSync(modulesDir)) return [];
  return fs.readdirSync(modulesDir)
    .filter(f => f.endsWith('.json'))
    .map(f => {
      const data = JSON.parse(fs.readFileSync(path.join(modulesDir, f), 'utf8'));
      return data;
    })
    .sort((a, b) => {
      const dayA = a.day_available || a.day || 0;
      const dayB = b.day_available || b.day || 0;
      if (dayA !== dayB) return dayA - dayB;
      return (a.order || 0) - (b.order || 0);
    });
}

// GET /api/modules
router.get('/', authMiddleware, (req, res) => {
  const db = require('../config/database');
  const gameState = db.prepare('SELECT current_day FROM game_state WHERE id = 1').get();
  const currentDay = gameState ? gameState.current_day : 1;

  const modules = loadModules()
    .filter(m => (m.day_available || m.day || 1) <= currentDay)
    .map(m => ({
      id: m.id,
      title: m.title,
      day: m.day_available || m.day || 1,
      description: m.description,
      duration: m.duration_minutes || m.duration || 10,
      order: m.order
    }));

  const progress = Progress.getByTeamId(req.team.id);
  const completed = progress ? JSON.parse(progress.modules_completed || '[]') : [];

  res.json({ modules, completed });
});

// GET /api/modules/:id
router.get('/:id', authMiddleware, (req, res) => {
  const modules = loadModules();
  const module = modules.find(m => m.id === req.params.id);
  if (!module) {
    return res.status(404).json({ error: 'Modul nicht gefunden' });
  }
  Interaction.log(req.team.id, 'module_open', { moduleId: req.params.id });
  res.json({ module });
});

// POST /api/modules/:id/complete
router.post('/:id/complete', authMiddleware, (req, res) => {
  const progress = Progress.completeModule(req.team.id, req.params.id);
  Interaction.log(req.team.id, 'module_complete', { moduleId: req.params.id });
  res.json({ progress });
});

module.exports = router;
