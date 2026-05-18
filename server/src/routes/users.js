const express = require('express');
const multer = require('multer');
const path = require('path');
const auth = require('../middleware/auth');
const db = require('../db');

const router = express.Router();

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../../uploads'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `user-${req.user.id}-${Date.now()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Images only'));
  },
});

function sanitizeUser(user) {
  const { password_hash, otp_code, otp_expires_at, ...safe } = user;
  return safe;
}

// GET /api/users/me
router.get('/me', auth, (req, res) => {
  res.json(sanitizeUser(req.user));
});

// PUT /api/users/me
router.put('/me', auth, async (req, res) => {
  const { full_name, age, city, skill_level, play_style } = req.body;
  try {
    const result = await db.query(
      `UPDATE users SET
        full_name      = COALESCE($1, full_name),
        age            = COALESCE($2, age),
        city           = COALESCE($3, city),
        skill_level    = COALESCE($4, skill_level),
        play_style     = COALESCE($5, play_style),
        updated_at     = NOW()
       WHERE id = $6 RETURNING *`,
      [full_name || null, age || null, city || null, skill_level || null, play_style || null, req.user.id]
    );
    res.json(sanitizeUser(result.rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Update failed' });
  }
});

// POST /api/users/me/photo
router.post('/me/photo', auth, upload.single('photo'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  try {
    const photoUrl = `/uploads/${req.file.filename}`;
    await db.query('UPDATE users SET profile_photo_url = $1 WHERE id = $2', [photoUrl, req.user.id]);
    res.json({ photo_url: photoUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// GET /api/users/:id (public profile — no sensitive fields)
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, full_name, profile_photo_url, city, skill_level, play_style, created_at
       FROM users WHERE id = $1 AND is_active = true`,
      [req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// POST /api/users/:id/report
router.post('/:id/report', auth, async (req, res) => {
  if (req.params.id === req.user.id) {
    return res.status(400).json({ error: 'Cannot report yourself' });
  }
  const { reason } = req.body;
  try {
    await db.query(
      `INSERT INTO user_reports (id, reporter_id, reported_id, reason)
       VALUES (gen_random_uuid(), $1, $2, $3)`,
      [req.user.id, req.params.id, reason || '']
    );
    res.json({ message: 'Report submitted — thank you' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit report' });
  }
});

module.exports = router;
