const Board = require('../models/Board');
const Interaction = require('../models/Interaction');
const Evidence = require('../models/Evidence');
const { sessions } = require('../routes/auth');

function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    let currentTeam = null;

    // Authenticate socket connection
    socket.on('auth', ({ token }) => {
      if (sessions.has(token)) {
        currentTeam = sessions.get(token);
        socket.join('authenticated');
        if (currentTeam.primary_spur) {
          socket.join(`spur:${currentTeam.primary_spur}`);
        }
        socket.join(`team:${currentTeam.id}`);
        socket.emit('auth:success', { team: currentTeam });

        // Notify others
        socket.to('authenticated').emit('team:online', {
          teamId: currentTeam.id,
          teamName: currentTeam.name
        });
      } else {
        socket.emit('auth:error', { error: 'Ungültiger Token' });
      }
    });

    // Board: Add note
    socket.on('board:add-note', (data) => {
      if (!currentTeam) return;
      const note = Board.createNote({
        teamId: currentTeam.id,
        title: data.title,
        content: data.content,
        columnName: data.columnName,
        tags: data.tags,
        evidenceLinks: data.evidenceLinks
      });
      if (note) {
        io.to('authenticated').emit('board:note-added', note);
      }
    });

    // Board: Update note
    socket.on('board:update-note', (data) => {
      if (!currentTeam) return;
      const note = Board.updateNote(data.id, currentTeam.id, data);
      if (note) {
        io.to('authenticated').emit('board:note-updated', note);
      }
    });

    // Board: Delete note
    socket.on('board:delete-note', ({ id }) => {
      if (!currentTeam) return;
      if (Board.deleteNote(id, currentTeam.id)) {
        io.to('authenticated').emit('board:note-deleted', { id });
      }
    });

    // Board: Add comment
    socket.on('board:add-comment', ({ noteId, content }) => {
      if (!currentTeam) return;
      const comment = Board.addComment(noteId, currentTeam.id, content);
      if (comment) {
        io.to('authenticated').emit('board:comment-added', { noteId, comment });
      }
    });

    // Evidence: Discovered
    socket.on('evidence:discover', ({ evidenceId }) => {
      if (!currentTeam) return;
      const evidence = Evidence.discover(evidenceId, currentTeam.id);
      if (evidence) {
        io.to('authenticated').emit('evidence:discovered', {
          evidenceId,
          teamId: currentTeam.id,
          teamName: currentTeam.name,
          title: evidence.title,
          importance: evidence.importance
        });
      }
    });

    // Team Chat
    socket.on('chat:send', ({ message }) => {
      if (!currentTeam || !message) return;
      const chatMessage = {
        teamId: currentTeam.id,
        teamName: currentTeam.name,
        message,
        timestamp: new Date().toISOString()
      };
      io.to('authenticated').emit('chat:message', chatMessage);
      Interaction.log(currentTeam.id, 'chat_message', { message: message.substring(0, 100) });
    });

    // Team ready signal
    socket.on('team:ready', () => {
      if (!currentTeam) return;
      io.to('authenticated').emit('team:ready', {
        teamId: currentTeam.id,
        teamName: currentTeam.name
      });
    });

    // Disconnect
    socket.on('disconnect', () => {
      if (currentTeam) {
        socket.to('authenticated').emit('team:offline', {
          teamId: currentTeam.id,
          teamName: currentTeam.name
        });
      }
    });
  });
}

module.exports = setupSocketHandlers;
