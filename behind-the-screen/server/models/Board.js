const db = require('../config/database');

const Board = {
  createNote({ teamId, title, content, columnName, tags, evidenceLinks }) {
    const run = db.transaction(() => {
      const result = db.prepare(`
        INSERT INTO board_notes (team_id, title, content, column_name, tags, evidence_links)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        teamId, title, content || '',
        columnName || 'timeline',
        JSON.stringify(tags || []),
        JSON.stringify(evidenceLinks || [])
      );
      db.prepare('UPDATE progress SET notes_created = notes_created + 1 WHERE team_id = ?').run(teamId);
      return result.lastInsertRowid;
    });
    return this.getNoteById(run());
  },

  getNoteById(id) {
    const note = db.prepare(`
      SELECT bn.*, t.name as team_name
      FROM board_notes bn
      JOIN teams t ON bn.team_id = t.id
      WHERE bn.id = ?
    `).get(id);
    if (note) {
      note.comments = this.getComments(id);
    }
    return note;
  },

  getAllNotes(columnName) {
    let query = `
      SELECT bn.*, t.name as team_name
      FROM board_notes bn
      JOIN teams t ON bn.team_id = t.id
    `;
    const params = {};
    if (columnName) {
      query += ' WHERE bn.column_name = @columnName';
      params.columnName = columnName;
    }
    query += ' ORDER BY bn.created_at DESC';

    const notes = db.prepare(query).all(params);
    for (const note of notes) {
      note.comments = this.getComments(note.id);
    }
    return notes;
  },

  updateNote(id, teamId, updates) {
    const note = this.getNoteById(id);
    if (!note || note.team_id !== teamId) return null;

    const fields = [];
    const params = { id };

    if (updates.title !== undefined) { fields.push('title = @title'); params.title = updates.title; }
    if (updates.content !== undefined) { fields.push('content = @content'); params.content = updates.content; }
    if (updates.columnName !== undefined) { fields.push('column_name = @columnName'); params.columnName = updates.columnName; }
    if (updates.tags !== undefined) { fields.push('tags = @tags'); params.tags = JSON.stringify(updates.tags); }
    if (updates.evidenceLinks !== undefined) { fields.push('evidence_links = @evidenceLinks'); params.evidenceLinks = JSON.stringify(updates.evidenceLinks); }

    if (fields.length === 0) return note;

    fields.push('updated_at = CURRENT_TIMESTAMP');
    db.prepare(`UPDATE board_notes SET ${fields.join(', ')} WHERE id = @id`).run(params);

    return this.getNoteById(id);
  },

  deleteNote(id, teamId) {
    const note = this.getNoteById(id);
    if (!note || note.team_id !== teamId) return false;
    db.prepare('DELETE FROM board_notes WHERE id = ?').run(id);
    return true;
  },

  addComment(noteId, teamId, content) {
    try {
      const result = db.prepare(`
        INSERT INTO board_comments (note_id, team_id, content) VALUES (?, ?, ?)
      `).run(noteId, teamId, content);
      return db.prepare(`
        SELECT bc.*, t.name as team_name
        FROM board_comments bc
        JOIN teams t ON bc.team_id = t.id
        WHERE bc.id = ?
      `).get(result.lastInsertRowid);
    } catch (e) {
      // Foreign-key fails when the parent note or team no longer exists.
      return null;
    }
  },

  getComments(noteId) {
    return db.prepare(`
      SELECT bc.*, t.name as team_name
      FROM board_comments bc
      JOIN teams t ON bc.team_id = t.id
      WHERE bc.note_id = ?
      ORDER BY bc.created_at ASC
    `).all(noteId);
  }
};

module.exports = Board;
