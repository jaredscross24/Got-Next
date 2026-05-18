require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Pool } = require('pg');

const dbUrl = process.env.DATABASE_URL || '';
console.log('DB URL host:', dbUrl ? dbUrl.replace(/:([^:@]+)@/, ':***@').split('@')[1] : 'NOT SET - using localhost fallback');

const pool = new Pool({
  connectionString: dbUrl || 'postgresql://postgres:password@localhost:5432/got_next',
  ssl: dbUrl.includes('railway.internal') ? false
     : dbUrl.includes('rlwy.net') ? { rejectUnauthorized: false }
     : false,
});

pool.on('error', (err) => {
  console.error('Unexpected DB client error', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
