const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '..', 'db', 'game.db');

// Delete existing database for fresh start
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log('Alte Datenbank geloescht.');
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Run schema
const schema = fs.readFileSync(path.join(__dirname, '..', 'db', 'init.sql'), 'utf8');
db.exec(schema);
console.log('Schema erstellt.');

// Load and insert evidence from all JSON files in data/evidence/
const evidenceDir = path.join(__dirname, '..', 'data', 'evidence');
if (fs.existsSync(evidenceDir)) {
  const insertEvidence = db.prepare(`
    INSERT OR IGNORE INTO evidence (id, type, spur, source, date, title, content, importance, phase, day_available, warnsignale_tags, analysis)
    VALUES (@id, @type, @spur, @source, @date, @title, @content, @importance, @phase, @day_available, @warnsignale_tags, @analysis)
  `);

  const insertMany = db.transaction((items) => {
    for (const item of items) {
      insertEvidence.run({
        id: item.id,
        type: item.type,
        spur: item.spur,
        source: item.source,
        date: item.date,
        title: item.title || '',
        content: typeof item.content === 'string' ? item.content : JSON.stringify(item.content),
        importance: item.importance || 3,
        phase: item.phase || null,
        day_available: item.day_available || 1,
        warnsignale_tags: JSON.stringify(item.warnsignale_tags || []),
        analysis: JSON.stringify(item.analysis || {})
      });
    }
  });

  const files = fs.readdirSync(evidenceDir).filter(f => f.endsWith('.json'));
  let totalCount = 0;
  for (const file of files) {
    const data = JSON.parse(fs.readFileSync(path.join(evidenceDir, file), 'utf8'));
    const items = Array.isArray(data) ? data : [data];
    insertMany(items);
    totalCount += items.length;
    console.log(`  ${file}: ${items.length} Beweise geladen`);
  }
  console.log(`Insgesamt ${totalCount} Beweisstücke geladen.`);
} else {
  console.log('Keine Evidence-Daten gefunden (server/data/evidence/ existiert nicht).');
}

db.close();
console.log('Datenbank-Initialisierung abgeschlossen.');
