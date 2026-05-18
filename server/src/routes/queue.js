const express = require('express');
const { v4: uuidv4 } = require('uuid');
const auth = require('../middleware/auth');
const db = require('../db');
const { getIo } = require('../socket');

const router = express.Router();

const FORMAT_PLAYERS = { '1v1': 2, '2v2': 4, '3v3': 6, '4v4': 8, '5v5': 10 };
const QUEUE_EXPIRY_HOURS = parseInt(process.env.QUEUE_EXPIRY_HOURS || '2', 10);

async function getQueue(courtId) {
  await db.query('DELETE FROM queue_entries WHERE expires_at < NOW()');
  const result = await db.query(
    `SELECT q.id, q.court_id, q.user_id, q.game_format, q.play_style, q.expires_at, q.created_at,
            u.full_name, u.profile_photo_url, u.skill_level
     FROM queue_entries q
     JOIN users u ON q.user_id = u.id
     WHERE q.court_id = $1
     ORDER BY q.created_at ASC`,
    [courtId]
  );
  return result.rows;
}

function broadcastQueue(courtId, queue) {
  try {
    const io = getIo();
    io.to(`court:${courtId}`).emit('queue_updated', queue);

    // Check if any game format has enough players
    const counts = {};
    queue.forEach((e) => { counts[e.game_format] = (counts[e.game_format] || 0) + 1; });
    Object.entries(counts).forEach(([format, count]) => {
      if (count >= FORMAT_PLAYERS[format]) {
        io.to(`court:${courtId}`).emit('game_ready', {
          format,
          players_needed: FORMAT_PLAYERS[format],
          players_in_queue: count,
        });
      }
    });
  } catch (_) {
    // socket not critical
  }
}

// GET /api/queue/court/:courtId
router.get('/court/:courtId', async (req, res) => {
  try {
    const queue = await getQueue(req.params.courtId);
    res.json(queue);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch queue' });
  }
});

// POST /api/queue/court/:courtId — join queue
router.post('/court/:courtId', auth, async (req, res) => {
  const { game_format, play_style } = req.body;

  if (!game_format || !play_style) {
    return res.status(400).json({ error: 'game_format and play_style are required' });
  }
  if (!FORMAT_PLAYERS[game_format]) {
    return res.status(400).json({ error: `Invalid game_format. Use: ${Object.keys(FORMAT_PLAYERS).join(', ')}` });
  }
  if (!['casual', 'competitive', 'league'].includes(play_style)) {
    return res.status(400).json({ error: 'play_style must be casual, competitive, or league' });
  }
  if (!req.user.phone_verified) {
    return res.status(403).json({ error: 'Phone verification required to join the queue' });
  }

  try {
    // Verify court exists
    const courtCheck = await db.query('SELECT id FROM courts WHERE id = $1', [req.params.courtId]);
    if (!courtCheck.rows[0]) return res.status(404).json({ error: 'Court not found' });

    // Check already in queue
    const existing = await db.query(
      'SELECT id FROM queue_entries WHERE court_id = $1 AND user_id = $2',
      [req.params.courtId, req.user.id]
    );
    if (existing.rows[0]) {
      return res.status(409).json({ error: 'Already in queue at this court' });
    }

    const id = uuidv4();
    const expires_at = new Date(Date.now() + QUEUE_EXPIRY_HOURS * 60 * 60 * 1000);

    await db.query(
      `INSERT INTO queue_entries (id, court_id, user_id, game_format, play_style, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, req.params.courtId, req.user.id, game_format, play_style, expires_at]
    );

    const queue = await getQueue(req.params.courtId);
    broadcastQueue(req.params.courtId, queue);
    res.status(201).json({ message: 'Joined queue', queue });
  } catch (err) {
    console.error('Join queue error:', err);
    res.status(500).json({ error: 'Failed to join queue' });
  }
});

// DELETE /api/queue/court/:courtId — leave queue
router.delete('/court/:courtId', auth, async (req, res) => {
  try {
    await db.query(
      'DELETE FROM queue_entries WHERE court_id = $1 AND user_id = $2',
      [req.params.courtId, req.user.id]
    );
    const queue = await getQueue(req.params.courtId);
    broadcastQueue(req.params.courtId, queue);
    res.json({ message: 'Left queue', queue });
  } catch (err) {
    console.error('Leave queue error:', err);
    res.status(500).json({ error: 'Failed to leave queue' });
  }
});

module.exports = router;
