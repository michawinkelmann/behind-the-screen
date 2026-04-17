// Builds a human-readable Markdown debrief of the current game state.
// Intended for post-lesson reflection with teacher + class.
const db = require('../config/database');

function esc(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

function parseJson(value, fallback) {
  if (value === null || value === undefined || value === '') return fallback;
  if (typeof value !== 'string') return value;
  try { return JSON.parse(value); } catch (_) { return fallback; }
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('de-DE');
}

function buildMarkdownExport() {
  const gameState = db.prepare('SELECT * FROM game_state WHERE id = 1').get() || {};
  const teams = db.prepare(`
    SELECT t.id, t.name, t.primary_spur, t.created_at,
           p.evidence_found, p.notes_created, p.warnsignale_identified,
           p.modules_completed, p.connection_score
    FROM teams t LEFT JOIN progress p ON p.team_id = t.id
    ORDER BY t.id
  `).all();
  const notes = db.prepare(`
    SELECT n.id, n.title, n.content, n.column_name, n.tags, n.created_at,
           t.name AS team_name
    FROM board_notes n LEFT JOIN teams t ON t.id = n.team_id
    ORDER BY n.created_at ASC
  `).all();
  const commentsByNote = new Map();
  const allComments = db.prepare(`
    SELECT c.note_id, c.content, c.created_at, t.name AS team_name
    FROM board_comments c LEFT JOIN teams t ON t.id = c.team_id
    ORDER BY c.created_at ASC
  `).all();
  for (const c of allComments) {
    if (!commentsByNote.has(c.note_id)) commentsByNote.set(c.note_id, []);
    commentsByNote.get(c.note_id).push(c);
  }
  const discovered = db.prepare(`
    SELECT e.title, e.spur, e.type, e.importance, e.discovered_at, t.name AS team_name
    FROM evidence e LEFT JOIN teams t ON t.id = e.discovered_by
    WHERE e.is_discovered = 1
    ORDER BY e.discovered_at ASC
  `).all();

  const lines = [];
  lines.push(`# Behind the Screen - Klassenprotokoll`);
  lines.push('');
  lines.push(`_Exportiert: ${formatDate(new Date().toISOString())}_`);
  lines.push('');
  lines.push(`## Spielstand`);
  lines.push('');
  lines.push(`- Tag: **${gameState.current_day || 1}**`);
  lines.push(`- Phase: **${gameState.current_phase || 1}**`);
  lines.push(`- Phasendauer: ${gameState.phase_duration_minutes || 60} Minuten`);
  lines.push(`- Pausiert: ${gameState.is_paused ? 'ja' : 'nein'}`);
  if (gameState.teacher_message) {
    lines.push(`- Aktuelle Durchsage: ${esc(gameState.teacher_message)}`);
  }
  lines.push('');

  // Teams
  lines.push(`## Teams (${teams.length})`);
  lines.push('');
  lines.push('| Team | Spur | Spuren gefunden | Notizen | Warnsignale | Module |');
  lines.push('|------|------|-----------------|---------|-------------|--------|');
  for (const t of teams) {
    const mods = parseJson(t.modules_completed, []);
    lines.push(`| ${esc(t.name)} | ${esc(t.primary_spur)} | ${t.evidence_found || 0} | ${t.notes_created || 0} | ${t.warnsignale_identified || 0} | ${mods.length} |`);
  }
  lines.push('');

  // Discovered evidence
  lines.push(`## Entdeckte Spuren (${discovered.length})`);
  lines.push('');
  if (discovered.length === 0) {
    lines.push('_Keine Spuren entdeckt._');
  } else {
    lines.push('| Zeit | Team | Titel | Spur | Wichtigkeit |');
    lines.push('|------|------|-------|------|-------------|');
    for (const e of discovered) {
      lines.push(`| ${formatDate(e.discovered_at)} | ${esc(e.team_name || '-')} | ${esc(e.title)} | ${esc(e.spur)} | ${e.importance} |`);
    }
  }
  lines.push('');

  // Board by column
  const columns = [
    { id: 'timeline', name: 'Timeline' },
    { id: 'profiles', name: 'Profile' },
    { id: 'warnsignale', name: 'Warnsignale' },
    { id: 'interventions', name: 'Interventionen' }
  ];
  lines.push(`## Pinnwand`);
  lines.push('');
  for (const col of columns) {
    const colNotes = notes.filter(n => n.column_name === col.id);
    lines.push(`### ${col.name} (${colNotes.length})`);
    lines.push('');
    if (colNotes.length === 0) {
      lines.push('_Keine Eintraege._');
      lines.push('');
      continue;
    }
    for (const note of colNotes) {
      const tags = parseJson(note.tags, []);
      lines.push(`#### ${esc(note.title)}`);
      lines.push('');
      lines.push(`_${esc(note.team_name || 'Team')} - ${formatDate(note.created_at)}${tags.length ? ' - Tags: ' + tags.map(esc).join(', ') : ''}_`);
      lines.push('');
      if (note.content) {
        lines.push(String(note.content).split(/\r?\n/).map(l => '> ' + l).join('\n'));
        lines.push('');
      }
      const comments = commentsByNote.get(note.id) || [];
      if (comments.length > 0) {
        lines.push('Kommentare:');
        for (const c of comments) {
          lines.push(`- **${esc(c.team_name || 'Team')}** (${formatDate(c.created_at)}): ${esc(c.content)}`);
        }
        lines.push('');
      }
    }
  }

  return lines.join('\n');
}

module.exports = { buildMarkdownExport };
