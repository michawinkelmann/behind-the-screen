require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const os = require('os');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

// Make io accessible in routes
app.set('io', io);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
  const interfaces = os.networkInterfaces();
  const addresses = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push(iface.address);
      }
    }
  }
  const port = process.env.PORT || 3000;
  const url = addresses.length > 0 ? `http://${addresses[0]}:${port}` : `http://localhost:${port}`;
  res.json({ url, addresses, port });
});

// Fallback to index.html for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'index.html'));
});

// Socket.IO
const setupSocketHandlers = require('./config/socket-handlers');
setupSocketHandlers(io);

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║      BEHIND THE SCREEN - Ermittlungsspiel       ║');
  console.log('╠══════════════════════════════════════════════════╣');

  // Get local IP addresses
  const interfaces = os.networkInterfaces();
  const addresses = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push(iface.address);
      }
    }
  }

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
