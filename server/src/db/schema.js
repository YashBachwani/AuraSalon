/**
 * Single SQLite / libSQL Schema Initialization
 */

const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS salon_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    salon_name_en TEXT NOT NULL DEFAULT 'Aura Salon',
    salon_name_gu TEXT NOT NULL DEFAULT 'ઓરા સલૂન',
    open_time TEXT NOT NULL DEFAULT '09:00',
    close_time TEXT NOT NULL DEFAULT '21:00',
    is_online_join_manually_closed INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name_en TEXT NOT NULL,
    name_gu TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
    price_inr INTEGER NOT NULL CHECK (price_inr >= 0),
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS barbers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    specialty TEXT NOT NULL DEFAULT '',
    avatar_color TEXT NOT NULL DEFAULT '#D4A017',
    availability TEXT NOT NULL DEFAULT 'AVAILABLE'
      CHECK (availability IN ('AVAILABLE', 'BUSY', 'ON_BREAK', 'OFF_DUTY')),
    is_on_duty INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS queue_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_date TEXT NOT NULL,
    token_seq INTEGER NOT NULL,
    token_number TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    preferred_barber_id INTEGER NULL REFERENCES barbers(id),
    assigned_barber_id INTEGER NULL REFERENCES barbers(id),
    status TEXT NOT NULL DEFAULT 'WAITING'
      CHECK (status IN ('WAITING', 'CALLED', 'IN_CHAIR', 'DONE', 'NO_SHOW', 'CANCELLED')),
    source TEXT NOT NULL DEFAULT 'ONLINE'
      CHECK (source IN ('ONLINE', 'WALK_IN')),
    total_duration_minutes INTEGER NOT NULL CHECK (total_duration_minutes > 0),
    total_price_inr INTEGER NOT NULL CHECK (total_price_inr >= 0),
    services_snapshot_json TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    called_at TEXT NULL,
    service_started_at TEXT NULL,
    completed_at TEXT NULL,
    UNIQUE (business_date, token_seq)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_queue_entries_date_status
    ON queue_entries (business_date, status, created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_queue_entries_phone_status
    ON queue_entries (phone, status)`,
];

export async function initializeSchema(client) {
  await client.execute('PRAGMA foreign_keys = ON');
  for (const sql of SCHEMA_STATEMENTS) {
    await client.execute(sql);
  }
}
