require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/courts', require('./routes/courts'));
app.use('/api/queue', require('./routes/queue'));
app.use('/api/games', require('./routes/games'));

app.get('/api/health', (_req, res) => res.json({ status: 'ok', app: 'Got Next' }));

module.exports = app;
