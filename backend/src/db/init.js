const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const dbPath = process.env.DB_PATH || './src/db/qr_platform.sqlite';
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  avatar_url TEXT,
  company TEXT,
  bio TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS qr_codes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL,               -- url, text, wifi, vcard, whatsapp, phone, email, sms, geo, upi, file, image, video, multilink
  mode TEXT NOT NULL DEFAULT 'static', -- static | dynamic
  short_code TEXT UNIQUE,           -- used for dynamic redirect
  target_data TEXT NOT NULL,        -- JSON payload with the actual content/config
  fg_color TEXT DEFAULT '#000000',
  bg_color TEXT DEFAULT '#FFFFFF',
  logo_url TEXT,
  size INTEGER DEFAULT 300,
  is_active INTEGER DEFAULT 1,
  folder TEXT DEFAULT 'default',
  tags TEXT,                        -- comma separated
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS qr_links (
  id TEXT PRIMARY KEY,
  qr_id TEXT NOT NULL REFERENCES qr_codes(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  order_index INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS scans (
  id TEXT PRIMARY KEY,
  qr_id TEXT NOT NULL REFERENCES qr_codes(id) ON DELETE CASCADE,
  scanned_at TEXT DEFAULT (datetime('now')),
  ip_hash TEXT,
  user_agent TEXT,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  referrer TEXT,
  country TEXT
);

CREATE INDEX IF NOT EXISTS idx_qr_user ON qr_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_qr_shortcode ON qr_codes(short_code);
CREATE INDEX IF NOT EXISTS idx_scans_qr ON scans(qr_id);
`);

module.exports = db;
