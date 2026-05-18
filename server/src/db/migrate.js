require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { pool } = require('../db');
const fs = require('fs');
const path = require('path');

async function migrate() {
  const sql = fs.readFileSync(
    path.join(__dirname, '../../migrations/001_initial.sql'),
    'utf-8'
  );
  await pool.query(sql);
  console.log('Migration complete!');
  process.exit(0);
}

migrate().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
