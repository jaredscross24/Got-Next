const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const auth = require('../middleware/auth');
const db = require('../db');

const router = express.Router();

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../../uploads'),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `court-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Images only'));
  },
});

// Haversine great-circle distance in SQL (returns distance in miles)
const HAVERSINE = `(3959 * acos(
  LEAST(1, cos(radians($1)) * cos(radians(latitude)) *
    cos(radians(longitude) - radians($2)) +
    sin(radians($1)) * sin(radians(latitude))
)))`;

// GET /api/courts
router.get('/', async (req, res) => {
  const { lat, lng, radius = 50, search } = req.query;

  try {
    let result;
    if (lat && lng) {
      result = await db.query(
        `SELECT *, ${HAVERSINE} AS distance_miles
         FROM courts
         WHERE ${HAVERSINE} < $3
         ORDER BY distance_miles
         LIMIT 100`,
        [parseFloat(lat), parseFloat(lng), parseFloat(radius)]
      );
    } else if (search) {
      result = await db.query(
        `SELECT * FROM courts
         WHERE name ILIKE $1 OR city ILIKE $1 OR country ILIKE $1 OR address ILIKE $1
         ORDER BY created_at DESC LIMIT 100`,
        [`%${search}%`]
      );
    } else {
      result = await db.query('SELECT * FROM courts ORDER BY created_at DESC LIMIT 200');
    }
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch courts error:', err);
    res.status(500).json({ error: 'Failed to fetch courts' });
  }
});

// GET /api/courts/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM courts WHERE id = $1', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Court not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch court' });
  }
});

// POST /api/courts
router.post('/', auth, upload.array('photos', 5), async (req, res) => {
  const { name, latitude, longitude, description, address, city, country, court_type } = req.body;

  if (!name || latitude === undefined || longitude === undefined) {
    return res.status(400).json({ error: 'Name, latitude, and longitude are required' });
  }

  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);
  if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return res.status(400).json({ error: 'Invalid coordinates' });
  }

  try {
    const photoUrls = req.files ? req.files.map((f) => `/uploads/${f.filename}`) : [];
    const id = uuidv4();

    const result = await db.query(
      `INSERT INTO courts
        (id, name, latitude, longitude, added_by, photo_urls, description, address, city, country, court_type)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [
        id, name.trim(), lat, lng, req.user.id, photoUrls,
        description || null, address || null, city || null,
        country || null, court_type || 'outdoor',
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create court error:', err);
    res.status(500).json({ error: 'Failed to create court' });
  }
});

module.exports = router;
