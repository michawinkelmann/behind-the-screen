const Interaction = require('../models/Interaction');
const { resolveToken } = require('../routes/auth');
const Presence = require('../models/Presence');

const CHAT_MIN_INTERVAL_MS = 500;
const CHAT_MAX_LEN = 500;
const UNAUTH_TIMEOUT_MS = 15_000;

function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    let currentTeam = null;
    let lastChatAt = 0;

    // Drop sockets that never authenticate so orphaned clients don't linger.
    const authTimeout = setTimeout(() => {
      if (!currentTeam) socket.disconnect(true);
    }, UNAUTH_TIMEOUT_MS);

    socket.on('auth', ({ token } = {}) => {
      const team = resolveToken(token);
      if (!team) {
        socket.emit('auth:error', { error: 'Ungueltiger Token' });
        return;
      }
      currentTeam = team;
      clearTimeout(authTimeout);

      socket.join('authenticated');
      if (currentTeam.primary_spur) {
        socket.join(`spur:${currentTeam.primary_spur}`);
      }
      if (currentTeam.id) {
        socket.join(`team:${currentTeam.id}`);
      }
      socket.emit('auth:success', { team: currentTeam });

      if (currentTeam.id) {
        Presence.addSocket(currentTeam.id, currentTeam.name, socket.id);
        socket.to('authenticated').emit('team:online', {
          teamId: currentTeam.id,
          teamName: currentTeam.name
        });
      }
    });

    // Team chat - rate limited + length capped.
    socket.on('chat:send', ({ message } = {}) => {
      if (!currentTeam || !currentTeam.id) return;
      if (typeof message !== 'string') return;
      const text = message.trim();
      if (!text) return;

      const now = Date.now();
      if (now - lastChatAt < CHAT_MIN_INTERVAL_MS) return;
      lastChatAt = now;

      const clean = text.slice(0, CHAT_MAX_LEN);
      const chatMessage = {
        teamId: currentTeam.id,
        teamName: currentTeam.name,
        message: clean,
        timestamp: new Date().toISOString()
      };
      io.to('authenticated').emit('chat:message', chatMessage);
      Interaction.log(currentTeam.id, 'chat_message', { message: clean.substring(0, 100) });
      Presence.touch(currentTeam.id);
    });

    // Team ready signal - for collaborative "we're done with this phase"
    socket.on('team:ready', () => {
      if (!currentTeam || !currentTeam.id) return;
      io.to('authenticated').emit('team:ready', {
        teamId: currentTeam.id,
        teamName: currentTeam.name
      });
    });

    socket.on('disconnect', () => {
      clearTimeout(authTimeout);
      if (currentTeam && currentTeam.id) {
        const stillOnline = Presence.removeSocket(currentTeam.id, socket.id);
        if (!stillOnline) {
          socket.to('authenticated').emit('team:offline', {
            teamId: currentTeam.id,
            teamName: currentTeam.name
          });
        }
      }
    });
  });
}

module.exports = setupSocketHandlers;
