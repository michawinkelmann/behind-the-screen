-- Teams
CREATE TABLE IF NOT EXISTS teams (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  primary_spur TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Evidence Items
CREATE TABLE IF NOT EXISTS evidence (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  spur TEXT NOT NULL,
  source TEXT NOT NULL,
  date DATE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  importance INTEGER DEFAULT 3,
  phase TEXT,
  day_available INTEGER DEFAULT 1,
  warnsignale_tags TEXT DEFAULT '[]',
  analysis TEXT DEFAULT '{}',
  is_discovered INTEGER DEFAULT 0,
  discovered_by INTEGER,
  discovered_at TIMESTAMP,
  FOREIGN KEY(discovered_by) REFERENCES teams(id)
);

-- Full-text search for evidence
CREATE VIRTUAL TABLE IF NOT EXISTS evidence_fts USING fts5(
  id,
  title,
  content,
  source,
  warnsignale_tags,
  tokenize='unicode61'
);

-- Triggers to keep FTS in sync
CREATE TRIGGER IF NOT EXISTS evidence_ai AFTER INSERT ON evidence BEGIN
  INSERT INTO evidence_fts(id, title, content, source, warnsignale_tags)
  VALUES (new.id, new.title, new.content, new.source, new.warnsignale_tags);
END;

CREATE TRIGGER IF NOT EXISTS evidence_ad AFTER DELETE ON evidence BEGIN
  INSERT INTO evidence_fts(evidence_fts, id, title, content, source, warnsignale_tags)
  VALUES ('delete', old.id, old.title, old.content, old.source, old.warnsignale_tags);
END;

-- Board Notes (Shared Pinnwand)
CREATE TABLE IF NOT EXISTS board_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  team_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  column_name TEXT DEFAULT 'timeline',
  tags TEXT DEFAULT '[]',
  evidence_links TEXT DEFAULT '[]',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(team_id) REFERENCES teams(id)
);

-- Board Comments
CREATE TABLE IF NOT EXISTS board_comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  note_id INTEGER NOT NULL,
  team_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(note_id) REFERENCES board_notes(id) ON DELETE CASCADE,
  FOREIGN KEY(team_id) REFERENCES teams(id)
);

-- Progress Tracking
CREATE TABLE IF NOT EXISTS progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  team_id INTEGER UNIQUE NOT NULL,
  day INTEGER DEFAULT 1,
  phase INTEGER DEFAULT 1,
  evidence_found INTEGER DEFAULT 0,
  notes_created INTEGER DEFAULT 0,
  modules_completed TEXT DEFAULT '[]',
  warnsignale_identified INTEGER DEFAULT 0,
  connection_score REAL DEFAULT 0.0,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(team_id) REFERENCES teams(id)
);

-- Game State (singleton row)
CREATE TABLE IF NOT EXISTS game_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  current_day INTEGER DEFAULT 1,
  current_phase INTEGER DEFAULT 1,
  phase_start_time TEXT,
  phase_duration_minutes INTEGER DEFAULT 60,
  is_paused INTEGER DEFAULT 0,
  teacher_message TEXT DEFAULT ''
);

-- Insert default game state
INSERT OR IGNORE INTO game_state (id, current_day, current_phase, is_paused)
VALUES (1, 1, 1, 0);

-- Interaction Log
CREATE TABLE IF NOT EXISTS interactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  team_id INTEGER,
  action_type TEXT NOT NULL,
  action_data TEXT DEFAULT '{}',
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(team_id) REFERENCES teams(id)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_evidence_spur ON evidence(spur);
CREATE INDEX IF NOT EXISTS idx_evidence_type ON evidence(type);
CREATE INDEX IF NOT EXISTS idx_evidence_date ON evidence(date);
CREATE INDEX IF NOT EXISTS idx_evidence_day ON evidence(day_available);
CREATE INDEX IF NOT EXISTS idx_evidence_importance ON evidence(importance);
CREATE INDEX IF NOT EXISTS idx_board_notes_team ON board_notes(team_id);
CREATE INDEX IF NOT EXISTS idx_board_notes_column ON board_notes(column_name);
CREATE INDEX IF NOT EXISTS idx_interactions_team ON interactions(team_id);
CREATE INDEX IF NOT EXISTS idx_interactions_type ON interactions(action_type);
