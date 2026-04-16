const express = require('express');
const Board = require('../models/Board');
const Interaction = require('../models/Interaction');
const { authMiddleware } = require('./auth');

const router = express.Router();

// GET /api/board/notes
router.get('/notes', authMiddleware, (req, res) => {
  const { column } = req.query;
  const notes = Board.getAllNotes(column || null);
  res.json({ notes });
});

// POST /api/board/notes
router.post('/notes', authMiddleware, (req, res) => {
  const { title, content, columnName, tags, evidenceLinks } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Titel erforderlich' });
  }
  const note = Board.createNote({
    teamId: req.team.id, title, content, columnName, tags, evidenceLinks
  });
  Interaction.log(req.team.id, 'board_note_create', { noteId: note.id });
  res.json({ note });
});

// PUT /api/board/notes/:id
router.put('/notes/:id', authMiddleware, (req, res) => {
  const note = Board.updateNote(parseInt(req.params.id), req.team.id, req.body);
  if (!note) {
    return res.status(404).json({ error: 'Notiz nicht gefunden oder kein Zugriff' });
  }
  res.json({ note });
});

// DELETE /api/board/notes/:id
router.delete('/notes/:id', authMiddleware, (req, res) => {
  const deleted = Board.deleteNote(parseInt(req.params.id), req.team.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Notiz nicht gefunden oder kein Zugriff' });
  }
  res.json({ success: true });
});

// POST /api/board/notes/:id/comment
router.post('/notes/:id/comment', authMiddleware, (req, res) => {
  const { content } = req.body;
  if (!content) {
    return res.status(400).json({ error: 'Kommentar-Text erforderlich' });
  }
  const comment = Board.addComment(parseInt(req.params.id), req.team.id, content);
  Interaction.log(req.team.id, 'board_comment', { noteId: req.params.id });
  res.json({ comment });
});

module.exports = router;
