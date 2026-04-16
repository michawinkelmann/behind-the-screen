const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Team = require('../models/Team');

const router = express.Router();

// In-memory session store (sufficient for local classroom use)
const sessions = new Map();

// Middleware to check auth
function authMiddleware(req, res, next) {
  const token = req.headers['x-session-token'];
  if (!token || !sessions.has(token)) {
    return res.status(401).json({ error: 'Nicht angemeldet' });
  }
  req.team = sessions.get(token);
  next();
}

// Admin auth middleware
function adminMiddleware(req, res, next) {
  const adminPw = req.headers['x-admin-token'];
  if (adminPw !== process.env.ADMIN_PASSWORD) {
    return res.status(403).json({ error: 'Kein Admin-Zugriff' });
  }
  next();
}

// POST /api/auth/register
router.post('/register', (req, res) => {
  const { name, password, primarySpur } = req.body;

  if (!name || !password || !primarySpur) {
    return res.status(400).json({ error: 'Name, Passwort und Spur erforderlich' });
  }

  const validSpuren = ['gamer', 'creator', 'discord', 'social-media', 'algorithmus'];
  if (!validSpuren.includes(primarySpur)) {
    return res.status(400).json({ error: 'Ungueltige Spur' });
  }

  try {
    const team = Team.create(name, password, primarySpur);
    const token = uuidv4();
    sessions.set(token, team);
    res.json({ team, token });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Teamname bereits vergeben' });
    }
    res.status(500).json({ error: 'Registrierung fehlgeschlagen' });
  }
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { name, password } = req.body;

  if (!name || !password) {
    return res.status(400).json({ error: 'Name und Passwort erforderlich' });
  }

  const team = Team.authenticate(name, password);
  if (!team) {
    return res.status(401).json({ error: 'Falsche Anmeldedaten' });
  }

  const token = uuidv4();
  sessions.set(token, team);
  res.json({ team, token });
});

// POST /api/auth/admin-login
router.post('/admin-login', (req, res) => {
  const { password } = req.body;
  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Falsches Admin-Passwort' });
  }
  const token = 'admin-' + uuidv4();
  sessions.set(token, { id: 0, name: 'Admin', isAdmin: true });
  res.json({ token, isAdmin: true });
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req, res) => {
  res.json({ team: req.team });
});

module.exports = { router, authMiddleware, adminMiddleware, sessions };
