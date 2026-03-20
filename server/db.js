const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data', 'portal.db');

// Ensure data directory exists
const fs = require('fs');
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT DEFAULT '',
    role TEXT NOT NULL DEFAULT 'user',
    suspended INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    last_login_at TEXT
  );

  CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_number TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL DEFAULT 'general',
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    submitter_name TEXT NOT NULL,
    submitter_email TEXT NOT NULL,
    submitter_phone TEXT DEFAULT '',
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    assigned_to TEXT NOT NULL DEFAULT '[]',
    cc_emails TEXT NOT NULL DEFAULT '[]',
    status TEXT NOT NULL DEFAULT 'open',
    priority TEXT NOT NULL DEFAULT 'medium',
    images TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    closed_at TEXT
  );

  CREATE TABLE IF NOT EXISTS responses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    user_name TEXT DEFAULT '',
    user_role TEXT DEFAULT 'user',
    message TEXT NOT NULL,
    images TEXT NOT NULL DEFAULT '[]',
    is_internal INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    message TEXT NOT NULL,
    ticket_number TEXT,
    ticket_id INTEGER,
    type TEXT NOT NULL DEFAULT 'ticket_created',
    read INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );
`);

// Seed default admin if no users exist
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
if (userCount.count === 0) {
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare(`
    INSERT INTO users (username, email, password, name, role, created_at)
    VALUES ('admin', 'admin@widesurf.com', ?, 'Admin User', 'admin', ?)
  `).run(hash, new Date().toISOString());
  console.log('Seeded default admin: admin@widesurf.com / admin123');
}

// Helper: convert DB row (snake_case) to API response (camelCase)
function toTicket(row) {
  if (!row) return null;
  return {
    id: row.id,
    ticketNumber: row.ticket_number,
    type: row.type,
    subject: row.subject,
    description: row.description,
    submitterName: row.submitter_name,
    submitterEmail: row.submitter_email,
    submitterPhone: row.submitter_phone || '',
    userId: row.user_id,
    assignedTo: JSON.parse(row.assigned_to || '[]'),
    ccEmails: JSON.parse(row.cc_emails || '[]'),
    status: row.status,
    priority: row.priority,
    images: JSON.parse(row.images || '[]'),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    closedAt: row.closed_at || undefined,
  };
}

function toResponse(row) {
  if (!row) return null;
  return {
    id: row.id,
    ticketId: row.ticket_id,
    userId: row.user_id,
    userName: row.user_name || '',
    userRole: row.user_role || 'user',
    message: row.message,
    images: JSON.parse(row.images || '[]'),
    isInternal: !!row.is_internal,
    createdAt: row.created_at,
  };
}

function toUser(row, includePassword = false) {
  if (!row) return null;
  const u = {
    id: row.id,
    username: row.username,
    email: row.email,
    name: row.name,
    phone: row.phone || '',
    role: row.role,
    suspended: !!row.suspended,
    createdAt: row.created_at,
    lastLoginAt: row.last_login_at || undefined,
  };
  if (includePassword) u.password = row.password;
  return u;
}

function toNotification(row) {
  if (!row) return null;
  return {
    id: row.id,
    message: row.message,
    ticketNumber: row.ticket_number,
    ticketId: row.ticket_id,
    type: row.type,
    read: !!row.read,
    createdAt: row.created_at,
  };
}

module.exports = { db, toTicket, toResponse, toUser, toNotification };
