const http = require('http');
const app = require('./app');
const { initSocket } = require('./socket');
const { pool } = require('./db');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 5000;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

async function start() {
  // Auto-run migration on startup (idempotent — uses IF NOT EXISTS)
  try {
    const sql = fs.readFileSync(path.join(__dirname, '../migrations/001_initial.sql'), 'utf-8');
    await pool.query(sql);
    console.log('DB schema ready');
  } catch (err) {
    console.error('Migration error:', err.message, err.code, err.detail);
  }

  const server = http.createServer(app);
  initSocket(server);
  server.listen(PORT, () => {
    console.log(`Got Next server running on port ${PORT}`);
  });
}

start();
