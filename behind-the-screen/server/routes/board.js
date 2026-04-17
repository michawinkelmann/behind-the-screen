const express = require('express');
const Board = require('../models/Board');
const Interaction = require('../models/Interaction');
const { authMiddleware } = require('./auth');

const router = express.Router();

const VALID_COLUMNS = ['timeline', 'profiles', 'warnsignale', 'interventions'];
const TITLE_MAX = 200;
const CONTENT_MAX = 4000;
const COMMENT_MAX = 1000;
const TAG_MAX = 40;
const MAX_TAGS = 10;

function sanitizeTags(tags) {
  if (!Array.isArray(tags)) return [];
  return tags
    .filter(t => typeof t === 'string')
    .map(t => t.trim().slice(0, TAG_MAX))
    .filter(Boolean)
    .slice(0, MAX_TAGS);
}

// GET /api/board/notes
router.get('/notes', authMiddleware, (req, res) => {
  const requested = typeof req.query.column === 'string' ? req.query.column.toLowerCase() : null;
  const column = VALID_COLUMNS.includes(requested) ? requested : null;
  const notes = Board.getAllNotes(column);
  res.json({ notes });
});

// POST /api/board/notes
router.post('/notes', authMiddleware, (req, res) => {
  const { title, content, columnName, tags, evidenceLinks } = req.body || {};
  if (typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ error: 'Titel erforderlich' });
  }
  const col = typeof columnName === 'string' ? columnName.toLowerCase() : 'timeline';
  if (!VALID_COLUMNS.includes(col)) {
    return res.status(400).json({ error: 'Ungueltige Spalte' });
  }
  const note = Board.createNote({
    teamId: req.team.id,
    title: title.trim().slice(0, TITLE_MAX),
    content: typeof content === 'string' ? content.slice(0, CONTENT_MAX) : '',
    columnName: col,
    tags: sanitizeTags(tags),
    evidenceLinks: Array.isArray(evidenceLinks) ? evidenceLinks.slice(0, 50) : []
  });
  Interaction.log(req.team.id, 'board_note_create', { noteId: note.id });

  const io = req.app.get('io');
  if (io) io.to('authenticated').emit('board:note-added', note);

  res.json({ note });
});

// PUT /api/board/notes/:id
router.put('/notes/:id', authMiddleware, (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Ungueltige ID' });

  const updates = {};
  if (typeof req.body.title === 'string') updates.title = req.body.title.trim().slice(0, TITLE_MAX);
  if (typeof req.body.content === 'string') updates.content = req.body.content.slice(0, CONTENT_MAX);
  if (typeof req.body.columnName === 'string') {
    const col = req.body.columnName.toLowerCase();
    if (!VALID_COLUMNS.includes(col)) return res.status(400).json({ error: 'Ungueltige Spalte' });
    updates.columnName = col;
  }
  if (req.body.tags !== undefined) updates.tags = sanitizeTags(req.body.tags);
  if (Array.isArray(req.body.evidenceLinks)) updates.evidenceLinks = req.body.evidenceLinks.slice(0, 50);

  const note = Board.updateNote(id, req.team.id, updates);
  if (!note) return res.status(404).json({ error: 'Notiz nicht gefunden oder kein Zugriff' });

  const io = req.app.get('io');
  if (io) io.to('authenticated').emit('board:note-updated', note);

  res.json({ note });
});

// DELETE /api/board/notes/:id
router.delete('/notes/:id', authMiddleware, (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Ungueltige ID' });

  const deleted = Board.deleteNote(id, req.team.id);
  if (!deleted) return res.status(404).json({ error: 'Notiz nicht gefunden oder kein Zugriff' });

  const io = req.app.get('io');
  if (io) io.to('authenticated').emit('board:note-deleted', { id });

  res.json({ success: true });
});

// POST /api/board/notes/:id/comment
router.post('/notes/:id/comment', authMiddleware, (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Ungueltige ID' });

  const raw = req.body && req.body.content;
  if (typeof raw !== 'string' || !raw.trim()) {
    return res.status(400).json({ error: 'Kommentar-Text erforderlich' });
  }
  const comment = Board.addComment(id, req.team.id, raw.trim().slice(0, COMMENT_MAX));
  if (!comment) return res.status(404).json({ error: 'Notiz nicht gefunden' });

  Interaction.log(req.team.id, 'board_comment', { noteId: id });

  const io = req.app.get('io');
  if (io) io.to('authenticated').emit('board:comment-added', { noteId: id, comment });

  res.json({ comment });
});

module.exports = router;
