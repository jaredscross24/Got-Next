CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  profile_photo_url VARCHAR(500),
  age INTEGER,
  city VARCHAR(255),
  phone VARCHAR(30),
  phone_verified BOOLEAN DEFAULT FALSE,
  skill_level VARCHAR(50),
  play_style VARCHAR(20),
  otp_code VARCHAR(6),
  otp_expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS courts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  added_by UUID REFERENCES users(id) ON DELETE SET NULL,
  photo_urls TEXT[] DEFAULT '{}',
  description TEXT,
  address VARCHAR(500),
  city VARCHAR(255),
  country VARCHAR(255),
  court_type VARCHAR(50) DEFAULT 'outdoor',
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS queue_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  court_id UUID NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_format VARCHAR(10) NOT NULL CHECK (game_format IN ('1v1', '2v2', '3v3', '4v4', '5v5')),
  play_style VARCHAR(20) NOT NULL CHECK (play_style IN ('casual', 'competitive', 'league')),
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(court_id, user_id)
);

CREATE TABLE IF NOT EXISTS games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  court_id UUID REFERENCES courts(id) ON DELETE SET NULL,
  format VARCHAR(10) NOT NULL,
  status VARCHAR(20) DEFAULT 'forming' CHECK (status IN ('forming', 'active', 'completed')),
  participant_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES users(id) ON DELETE SET NULL,
  reported_id UUID REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_queue_court ON queue_entries(court_id);
CREATE INDEX IF NOT EXISTS idx_queue_user ON queue_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_queue_expires ON queue_entries(expires_at);
CREATE INDEX IF NOT EXISTS idx_courts_lat ON courts(latitude);
CREATE INDEX IF NOT EXISTS idx_courts_lng ON courts(longitude);
CREATE INDEX IF NOT EXISTS idx_games_court ON games(court_id);
