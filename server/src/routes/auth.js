const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendOTP(phone, otp) {
  if (
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_PHONE_NUMBER
  ) {
    const twilio = require('twilio')(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    await twilio.messages.create({
      body: `Your Got Next code is: ${otp}. Valid for 10 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone,
    });
    return false; // not dev mode
  } else {
    console.log(`[DEV OTP] Phone: ${phone} → Code: ${otp}`);
    return true; // dev mode
  }
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { email, password, full_name } = req.body;
  if (!email || !password || !full_name) {
    return res.status(400).json({ error: 'Email, password, and full name are required' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  try {
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows[0]) return res.status(409).json({ error: 'Email already registered' });

    const password_hash = await bcrypt.hash(password, 12);
    const id = uuidv4();
    await db.query(
      'INSERT INTO users (id, email, password_hash, full_name) VALUES ($1, $2, $3, $4)',
      [id, email.toLowerCase(), password_hash, full_name.trim()]
    );

    const token = jwt.sign({ userId: id }, process.env.JWT_SECRET || 'dev_secret', {
      expiresIn: '30d',
    });
    res.status(201).json({ token, userId: id });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  try {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'dev_secret', {
      expiresIn: '30d',
    });
    res.json({ token, userId: user.id });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/auth/send-otp
router.post('/send-otp', authMiddleware, async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'Phone number required' });

  try {
    const otp = generateOTP();
    const expires = new Date(Date.now() + 10 * 60 * 1000);

    await db.query(
      'UPDATE users SET phone = $1, otp_code = $2, otp_expires_at = $3 WHERE id = $4',
      [phone, otp, expires, req.user.id]
    );

    const isDevMode = await sendOTP(phone, otp);
    const response = { message: 'OTP sent' };
    if (isDevMode) response.dev_otp = otp;
    res.json(response);
  } catch (err) {
    console.error('Send OTP error:', err);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', authMiddleware, async (req, res) => {
  const { otp } = req.body;
  if (!otp) return res.status(400).json({ error: 'OTP required' });

  try {
    const user = req.user;
    if (!user.otp_code || !user.otp_expires_at) {
      return res.status(400).json({ error: 'No OTP pending — request a new code first' });
    }
    if (new Date() > new Date(user.otp_expires_at)) {
      return res.status(400).json({ error: 'OTP expired — request a new code' });
    }
    if (user.otp_code !== String(otp)) {
      return res.status(400).json({ error: 'Incorrect code' });
    }

    await db.query(
      'UPDATE users SET phone_verified = true, otp_code = NULL, otp_expires_at = NULL WHERE id = $1',
      [user.id]
    );
    res.json({ message: 'Phone verified!' });
  } catch (err) {
    console.error('Verify OTP error:', err);
    res.status(500).json({ error: 'Verification failed' });
  }
});

module.exports = router;
