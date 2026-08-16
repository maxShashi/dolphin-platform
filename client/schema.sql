-- D1 Database Schema for Dolphin Digital Marketing Platform
-- Run: npx wrangler d1 execute dolphin-platform-db --file=./schema.sql

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT,
  email TEXT UNIQUE,
  password TEXT,
  display_name TEXT,
  avatar TEXT,
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS ad_accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id TEXT,
  account_name TEXT,
  account_type TEXT,
  account_attr TEXT,
  bm_id TEXT,
  timezone TEXT,
  total_spend REAL DEFAULT 0,
  status TEXT DEFAULT 'normal',
  delivery_time TEXT,
  rental_notes TEXT,
  account_notes TEXT,
  account_tags TEXT,
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS rental_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_no TEXT,
  platform TEXT,
  account_type TEXT,
  account_attr TEXT,
  timezone TEXT,
  bm_id TEXT,
  status TEXT,
  created_at TEXT,
  completed_at TEXT,
  account_id TEXT
);

CREATE TABLE IF NOT EXISTS recharge_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_no TEXT,
  platform TEXT,
  payment_status TEXT,
  recharge_status TEXT,
  order_amount REAL,
  service_fee REAL,
  recharge_amount REAL,
  created_at TEXT,
  completed_at TEXT
);

CREATE TABLE IF NOT EXISTS fund_flows (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT,
  amount REAL,
  status TEXT,
  description TEXT,
  created_at TEXT
);

CREATE TABLE IF NOT EXISTS consumption_data (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT,
  total_impressions INTEGER,
  total_clicks INTEGER,
  total_spend REAL,
  ctr REAL,
  account_id TEXT
);

-- Seed admin user (password: admin123)
INSERT OR IGNORE INTO users (id, username, email, password, display_name, created_at, updated_at)
VALUES (1, 'admin', 'admin@dolphin.com', '$2a$10$.z78LYXLslSWsijyEhTTRut706oLcuFRSvzS81chpi55gsEBujwGi', 'BatraShashi', '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z');