const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Team = require('../models/Team');

const router = express.Router();

// In-memory session store (sufficient for local classroom use).
// Persistence across restarts is handled client-side: teams re-authenticate
// automatically via /login (password cached) and admin via adminPassword.
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
  if (!adminPw || adminPw !== process.env.ADMIN_PASSWORD) {
    return res.status(403).json({ error: 'Kein Admin-Zugriff' });
  }
  next();
}

// Validation constants
const NAME_MIN = 2;
const NAME_MAX = 40;
const PW_MIN = 4;
const PW_MAX = 128;
const VALID_SPUREN = ['gamer', 'creator', 'discord', 'social-media', 'algorithmus'];

function validateCredentials(name, password) {
  if (typeof name !== 'string' || typeof password !== 'string') {
    return 'Ungueltige Eingabe';
  }
  const trimmed = name.trim();
  if (trimmed.length < NAME_MIN || trimmed.length > NAME_MAX) {
    return `Teamname muss ${NAME_MIN}-${NAME_MAX} Zeichen haben`;
  }
  if (password.length < PW_MIN || password.length > PW_MAX) {
    return `Passwort muss ${PW_MIN}-${PW_MAX} Zeichen haben`;
  }
  return null;
}

// Tiny in-memory rate limiter (per IP+route). Enough to slow brute-force on a
// LAN without adding a dependency.
const attemptLog = new Map();
function rateLimit(key, max, windowMs) {
  const now = Date.now();
  const entry = attemptLog.get(key) || { count: 0, resetAt: now + windowMs };
  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + windowMs;
  }
  entry.count += 1;
  attemptLog.set(key, entry);
  return entry.count > max;
}
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of attemptLog) if (now > v.resetAt) attemptLog.delete(k);
}, 60_000).unref();

function clientKey(req, bucket) {
  return `${bucket}:${req.ip}`;
}

// POST /api/auth/register
router.post('/register', (req, res) => {
  if (rateLimit(clientKey(req, 'register'), 10, 60 * 60 * 1000)) {
    return res.status(429).json({ error: 'Zu viele Registrierungen - bitte warten' });
  }

  const { name, password, primarySpur } = req.body || {};
  const err = validateCredentials(name, password);
  if (err) return res.status(400).json({ error: err });
  if (!VALID_SPUREN.includes(primarySpur)) {
    return res.status(400).json({ error: 'Ungueltige Spur' });
  }

  try {
    const team = Team.create(name.trim(), password, primarySpur);
    const token = uuidv4();
    sessions.set(token, team);
    res.json({ team, token });
  } catch (e) {
    if (e.message && e.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Teamname bereits vergeben' });
    }
    console.error('Register error:', e);
    res.status(500).json({ error: 'Registrierung fehlgeschlagen' });
  }
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  if (rateLimit(clientKey(req, 'login'), 20, 15 * 60 * 1000)) {
    return res.status(429).json({ error: 'Zu viele Login-Versuche - bitte spaeter erneut' });
  }

  const { name, password } = req.body || {};
  if (typeof name !== 'string' || typeof password !== 'string' || !name || !password) {
    return res.status(400).json({ error: 'Name und Passwort erforderlich' });
  }

  const team = Team.authenticate(name.trim(), password);
  if (!team) {
    return res.status(401).json({ error: 'Falsche Anmeldedaten' });
  }

  const token = uuidv4();
  sessions.set(token, team);
  res.json({ team, token });
});

// POST /api/auth/admin-login
router.post('/admin-login', (req, res) => {
  if (rateLimit(clientKey(req, 'admin-login'), 10, 15 * 60 * 1000)) {
    return res.status(429).json({ error: 'Zu viele Login-Versuche - bitte spaeter erneut' });
  }

  const { password } = req.body || {};
  if (typeof password !== 'string' || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Falsches Admin-Passwort' });
  }
  const token = 'admin-' + uuidv4();
  sessions.set(token, { id: 0, name: 'Admin', isAdmin: true });
  res.json({ token, isAdmin: true });
});

// GET /api/auth/me - used by clients to verify an existing session
router.get('/me', authMiddleware, (req, res) => {
  res.json({ team: req.team });
});

// POST /api/auth/logout - invalidate current session
router.post('/logout', (req, res) => {
  const token = req.headers['x-session-token'];
  if (token) sessions.delete(token);
  res.json({ success: true });
});

module.exports = { router, authMiddleware, adminMiddleware, sessions };
