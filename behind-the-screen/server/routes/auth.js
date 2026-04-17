const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Team = require('../models/Team');
const Session = require('../models/Session');

const router = express.Router();

// Admin tokens are kept in-memory only (short-lived, no team row to reference).
// Team sessions live in the `sessions` table and survive restarts.
const adminTokens = new Map(); // token -> { createdAt }
const ADMIN_TOKEN_TTL_MS = 12 * 60 * 60 * 1000; // 12h

function pruneAdminTokens() {
  const cutoff = Date.now() - ADMIN_TOKEN_TTL_MS;
  for (const [t, data] of adminTokens) {
    if (data.createdAt < cutoff) adminTokens.delete(t);
  }
}
setInterval(pruneAdminTokens, 60 * 60 * 1000).unref();
setInterval(() => Session.pruneExpired(), 60 * 60 * 1000).unref();

function resolveToken(token) {
  if (!token || typeof token !== 'string') return null;
  if (adminTokens.has(token)) {
    const entry = adminTokens.get(token);
    if (Date.now() - entry.createdAt > ADMIN_TOKEN_TTL_MS) {
      adminTokens.delete(token);
      return null;
    }
    return { id: 0, name: 'Admin', isAdmin: true };
  }
  return Session.getTeam(token);
}

function authMiddleware(req, res, next) {
  const token = req.headers['x-session-token'];
  const team = resolveToken(token);
  if (!team) {
    return res.status(401).json({ error: 'Nicht angemeldet' });
  }
  req.team = team;
  req.sessionToken = token;
  next();
}

function adminMiddleware(req, res, next) {
  const adminPw = req.headers['x-admin-token'];
  if (!adminPw || adminPw !== process.env.ADMIN_PASSWORD) {
    return res.status(403).json({ error: 'Kein Admin-Zugriff' });
  }
  next();
}

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
    const token = Session.createForTeam(team.id);
    res.json({ team, token });
  } catch (e) {
    if (e.message && e.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Teamname bereits vergeben' });
    }
    console.error('Register error:', e);
    res.status(500).json({ error: 'Registrierung fehlgeschlagen' });
  }
});

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

  const token = Session.createForTeam(team.id);
  res.json({ team, token });
});

router.post('/admin-login', (req, res) => {
  if (rateLimit(clientKey(req, 'admin-login'), 10, 15 * 60 * 1000)) {
    return res.status(429).json({ error: 'Zu viele Login-Versuche - bitte spaeter erneut' });
  }

  const { password } = req.body || {};
  if (typeof password !== 'string' || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Falsches Admin-Passwort' });
  }
  const token = 'admin-' + uuidv4();
  adminTokens.set(token, { createdAt: Date.now() });
  res.json({ token, isAdmin: true });
});

router.get('/me', authMiddleware, (req, res) => {
  res.json({ team: req.team });
});

router.post('/logout', (req, res) => {
  const token = req.headers['x-session-token'];
  if (token) {
    if (adminTokens.has(token)) adminTokens.delete(token);
    else Session.destroy(token);
  }
  res.json({ success: true });
});

module.exports = {
  router,
  authMiddleware,
  adminMiddleware,
  resolveToken
};
