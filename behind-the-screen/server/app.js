require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const os = require('os');

if (!process.env.ADMIN_PASSWORD) {
  console.warn('[WARN] ADMIN_PASSWORD nicht gesetzt - verwende Fallback. Bitte .env anpassen!');
  process.env.ADMIN_PASSWORD = 'admin2024';
}
if (process.env.ADMIN_PASSWORD === 'admin2024') {
  console.warn('[WARN] Standard-Admin-Passwort aktiv. Bitte ADMIN_PASSWORD in .env aendern!');
}

function getLocalAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push(iface.address);
      }
    }
  }
  return addresses;
}

const app = express();
const server = http.createServer(app);

// Socket.IO: same-origin is sufficient for a locally served SPA.
// Accept both the loopback URL and any local IPv4 host the server listens on.
const allowedOrigins = new Set([null, 'null']);
const PORT = process.env.PORT || 3000;
['localhost', '127.0.0.1', ...getLocalAddresses()].forEach(host => {
  allowedOrigins.add(`http://${host}:${PORT}`);
  allowedOrigins.add(`https://${host}:${PORT}`);
});

const io = new Server(server, {
  cors: {
    origin: (origin, cb) => {
      // Same-origin requests come through without an Origin header.
      if (!origin || allowedOrigins.has(origin)) return cb(null, true);
      return cb(new Error('Origin nicht erlaubt'), false);
    }
  }
});

app.set('io', io);

// Middleware - guard against oversized payloads
app.use(express.json({ limit: '256kb' }));
app.use(express.urlencoded({ extended: true, limit: '64kb' }));

// Serve client files
app.use(express.static(path.join(__dirname, '..', 'client')));

// API Routes
const { router: authRouter } = require('./routes/auth');
app.use('/api/auth', authRouter);
app.use('/api/evidence', require('./routes/evidence'));
app.use('/api/board', require('./routes/board'));
app.use('/api/modules', require('./routes/modules'));
app.use('/api/admin', require('./routes/admin'));

// Game state endpoint (no auth needed for initial load)
const GameLogic = require('./config/game-logic');
app.get('/api/game/state', (req, res) => {
  res.json(GameLogic.getPhaseInfo());
});

// Server info (for QR code display)
app.get('/api/server-info', (req, res) => {
  const addresses = getLocalAddresses();
  const url = addresses.length > 0 ? `http://${addresses[0]}:${PORT}` : `http://localhost:${PORT}`;
  res.json({ url, addresses, port: PORT });
});

// JSON 404 for unknown API paths so clients surface errors cleanly
app.use('/api', (req, res) => res.status(404).json({ error: 'Endpunkt nicht gefunden' }));

// Fallback to index.html for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'index.html'));
});

// Socket.IO
const setupSocketHandlers = require('./config/socket-handlers');
setupSocketHandlers(io);

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║      BEHIND THE SCREEN - Ermittlungsspiel       ║');
  console.log('╠══════════════════════════════════════════════════╣');

  const addresses = getLocalAddresses();
  console.log(`║  Lokal:   http://localhost:${PORT}                 ║`);
  if (addresses.length > 0) {
    for (const addr of addresses) {
      const url = `http://${addr}:${PORT}`;
      const padding = ' '.repeat(Math.max(0, 48 - url.length - 12));
      console.log(`║  Netzwerk: ${url}${padding}║`);
    }
    console.log('╠══════════════════════════════════════════════════╣');
    console.log('║  Schueler verbinden sich ueber die Netzwerk-URL ║');
    console.log('║  Admin-Panel: /admin (Passwort in .env)         ║');
  }
  console.log('╚══════════════════════════════════════════════════╝');
  console.log('');
});

// Graceful shutdown so SQLite WAL flushes cleanly on Ctrl+C
function shutdown(signal) {
  console.log(`\n[${signal}] Server wird beendet...`);
  try { require('./config/database').close(); } catch (e) {}
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 3000).unref();
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
