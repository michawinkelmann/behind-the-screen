const db = require('../config/database');

const Evidence = {
  search({ q, spur, type, source, dateFrom, dateTo, importance, dayAvailable, limit = 50, offset = 0 }) {
    let query = 'SELECT e.* FROM evidence e';
    const conditions = [];
    const params = {};

    // FTS keyword search
    if (q && q.trim()) {
      query = `SELECT e.* FROM evidence e
        INNER JOIN evidence_fts fts ON e.id = fts.id`;
      conditions.push("evidence_fts MATCH @q");
      // Escape special FTS5 characters and use prefix matching
      params.q = q.trim().split(/\s+/).map(w => `"${w}"*`).join(' ');
    }

    if (spur) { conditions.push('e.spur = @spur'); params.spur = spur; }
    if (type) { conditions.push('e.type = @type'); params.type = type; }
    if (source) { conditions.push('e.source LIKE @source'); params.source = `%${source}%`; }
    if (dateFrom) { conditions.push('e.date >= @dateFrom'); params.dateFrom = dateFrom; }
    if (dateTo) { conditions.push('e.date <= @dateTo'); params.dateTo = dateTo; }
    if (importance) { conditions.push('e.importance >= @importance'); params.importance = importance; }
    if (dayAvailable) { conditions.push('e.day_available <= @dayAvailable'); params.dayAvailable = dayAvailable; }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY e.date ASC, e.importance DESC LIMIT @limit OFFSET @offset';
    params.limit = limit;
    params.offset = offset;

    return db.prepare(query).all(params);
  },

  getById(id) {
    return db.prepare('SELECT * FROM evidence WHERE id = ?').get(id);
  },

  discover(id, teamId) {
    const evidence = this.getById(id);
    if (!evidence) return null;

    if (!evidence.is_discovered) {
      db.prepare(`
        UPDATE evidence SET is_discovered = 1, discovered_by = ?, discovered_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(teamId, id);

      // Update team progress
      db.prepare(`
        UPDATE progress SET evidence_found = evidence_found + 1
        WHERE team_id = ?
      `).run(teamId);
    }

    return this.getById(id);
  },

  getDiscoveryStats() {
    const total = db.prepare('SELECT COUNT(*) as count FROM evidence').get().count;
    const discovered = db.prepare('SELECT COUNT(*) as count FROM evidence WHERE is_discovered = 1').get().count;

    const bySpur = db.prepare(`
      SELECT spur,
             COUNT(*) as total,
             SUM(CASE WHEN is_discovered = 1 THEN 1 ELSE 0 END) as discovered
      FROM evidence GROUP BY spur
    `).all();

    return { total, discovered, bySpur };
  },

  getSpurStats(dayAvailable) {
    const params = dayAvailable ? { dayAvailable } : {};
    const where = dayAvailable ? 'WHERE day_available <= @dayAvailable' : '';
    return db.prepare(`
      SELECT spur,
             COUNT(*) as total,
             SUM(CASE WHEN is_discovered = 1 THEN 1 ELSE 0 END) as discovered
      FROM evidence ${where} GROUP BY spur
    `).all(params);
  },

  getTypes() {
    return db.prepare('SELECT DISTINCT type FROM evidence ORDER BY type').all().map(r => r.type);
  },

  getSources() {
    return db.prepare('SELECT DISTINCT source FROM evidence ORDER BY source').all().map(r => r.source);
  },

  resetDiscoveries() {
    db.prepare('UPDATE evidence SET is_discovered = 0, discovered_by = NULL, discovered_at = NULL').run();
  }
};

module.exports = Evidence;
