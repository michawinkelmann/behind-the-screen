// In-memory presence tracking. Mirrors socket connections keyed by team id.
// Activity timestamps are also persisted via the `interactions` table, so the
// heatmap survives restarts even though live presence does not.
const db = require('../config/database');

const presence = new Map(); // teamId -> { teamName, sockets: Set<socketId>, lastActivity: number, firstJoined: number }

function addSocket(teamId, teamName, socketId) {
  const now = Date.now();
  const entry = presence.get(teamId) || {
    teamName,
    sockets: new Set(),
    lastActivity: now,
    firstJoined: now
  };
  entry.teamName = teamName || entry.teamName;
  entry.sockets.add(socketId);
  entry.lastActivity = now;
  presence.set(teamId, entry);
  return entry;
}

function removeSocket(teamId, socketId) {
  const entry = presence.get(teamId);
  if (!entry) return false;
  entry.sockets.delete(socketId);
  if (entry.sockets.size === 0) {
    presence.delete(teamId);
    return false;
  }
  return true;
}

function touch(teamId) {
  const entry = presence.get(teamId);
  if (entry) entry.lastActivity = Date.now();
}

function snapshot() {
  const now = Date.now();
  return Array.from(presence.entries()).map(([teamId, entry]) => ({
    teamId,
    teamName: entry.teamName,
    sockets: entry.sockets.size,
    idleSeconds: Math.round((now - entry.lastActivity) / 1000),
    onlineSeconds: Math.round((now - entry.firstJoined) / 1000)
  }));
}

// Heatmap: counts interactions per team bucketed into 5-minute windows over
// the last `minutes` minutes. Useful to spot which teams stalled.
function heatmap(minutes = 60, bucketMinutes = 5) {
  const buckets = Math.ceil(minutes / bucketMinutes);
  const sinceIso = new Date(Date.now() - minutes * 60 * 1000).toISOString();

  const rows = db.prepare(`
    SELECT
      i.team_id AS teamId,
      t.name AS teamName,
      CAST((strftime('%s','now') - strftime('%s', i.timestamp)) / 60 AS INTEGER) AS minutesAgo
    FROM interactions i
    LEFT JOIN teams t ON t.id = i.team_id
    WHERE i.timestamp >= ? AND i.team_id IS NOT NULL
  `).all(sinceIso);

  const byTeam = new Map();
  for (const row of rows) {
    const bucket = Math.min(buckets - 1, Math.floor(row.minutesAgo / bucketMinutes));
    if (bucket < 0) continue;
    if (!byTeam.has(row.teamId)) {
      byTeam.set(row.teamId, {
        teamId: row.teamId,
        teamName: row.teamName,
        counts: new Array(buckets).fill(0),
        total: 0
      });
    }
    const t = byTeam.get(row.teamId);
    // Bucket 0 = most recent window; reverse so the array reads oldest->newest.
    t.counts[buckets - 1 - bucket] += 1;
    t.total += 1;
  }

  return {
    minutes,
    bucketMinutes,
    buckets,
    teams: Array.from(byTeam.values()).sort((a, b) => b.total - a.total)
  };
}

module.exports = { addSocket, removeSocket, touch, snapshot, heatmap };
