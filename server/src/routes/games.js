const express = require('express');
const auth = require('../middleware/auth');
const db = require('../db');

const router = express.Router();

// GET /api/games/me
router.get('/me', auth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT g.*, c.name AS court_name, c.city AS court_city, c.country AS court_country
       FROM games g
       LEFT JOIN courts c ON g.court_id = c.id
       WHERE $1 = ANY(g.participant_ids)
       ORDER BY g.created_at DESC
       LIMIT 50`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch games' });
  }
});

// GET /api/games/court/:courtId
router.get('/court/:courtId', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM games WHERE court_id = $1 ORDER BY created_at DESC LIMIT 20`,
      [req.params.courtId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch court games' });
  }
});

module.exports = router;
