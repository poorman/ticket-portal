const express = require('express');
const bcrypt = require('bcryptjs');
const { db, toUser } = require('../db');
const { requireAuth, requireAdmin } = require('../auth');
const { generateUsername } = require('./auth');

const router = express.Router();

// GET /api/users — list all users (requires auth for @mention autocomplete; full details for admin)
router.get('/', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM users ORDER BY name ASC').all();
  res.json({ users: rows.map((r) => toUser(r)) });
});

// GET /api/users/:id
router.get('/:id', requireAuth, (req, res) => {
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'User not found' });
  res.json({ user: toUser(row) });
});

// POST /api/users — admin create user
router.post('/', requireAdmin, (req, res) => {
  const { name, email, password, role, phone } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Name, email, and password required' });

  const existing = db.prepare('SELECT 1 FROM users WHERE LOWER(email) = ?').get(email.toLowerCase());
  if (existing) return res.status(409).json({ error: 'A user with this email already exists' });

  const hash = bcrypt.hashSync(password, 10);
  const username = generateUsername(email);
  const now = new Date().toISOString();
  const result = db.prepare(
    'INSERT INTO users (username, email, password, name, phone, role, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(username, email, hash, name, phone || '', role || 'user', now);

  const user = toUser(db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid));
  res.status(201).json({ user });
});

// PUT /api/users/:id — admin update user
router.put('/:id', requireAdmin, (req, res) => {
  const { name, username, email, password, phone, role } = req.body;
  const target = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!target) return res.status(404).json({ error: 'User not found' });

  if (email && email.toLowerCase() !== target.email.toLowerCase()) {
    const taken = db.prepare('SELECT 1 FROM users WHERE LOWER(email) = ? AND id != ?').get(email.toLowerCase(), target.id);
    if (taken) return res.status(409).json({ error: 'A user with this email already exists' });
  }
  if (username && username !== target.username) {
    const cleanUsername = username.toLowerCase().replace(/[^a-z0-9]/g, '');
    const taken = db.prepare('SELECT 1 FROM users WHERE username = ? AND id != ?').get(cleanUsername, target.id);
    if (taken) return res.status(409).json({ error: 'This username is already taken' });
  }

  db.prepare(`
    UPDATE users SET name = ?, username = ?, email = ?, phone = ?, role = ?
    ${password ? ', password = ?' : ''}
    WHERE id = ?
  `).run(
    name ?? target.name,
    username ? username.toLowerCase().replace(/[^a-z0-9]/g, '') : target.username,
    email ?? target.email,
    phone ?? target.phone,
    role ?? target.role,
    ...(password ? [bcrypt.hashSync(password, 10)] : []),
    target.id
  );

  const user = toUser(db.prepare('SELECT * FROM users WHERE id = ?').get(target.id));
  res.json({ user });
});

// DELETE /api/users/:id — admin delete user
router.delete('/:id', requireAdmin, (req, res) => {
  const target = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!target) return res.status(404).json({ error: 'User not found' });
  if (target.role === 'admin') {
    const adminCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'admin'").get().count;
    if (adminCount <= 1) return res.status(400).json({ error: 'Cannot delete the last admin user' });
  }
  if (req.user.id === target.id) return res.status(400).json({ error: 'Cannot delete your own account' });

  db.prepare('DELETE FROM users WHERE id = ?').run(target.id);
  res.json({ success: true });
});

// POST /api/users/:id/suspend — toggle suspend
router.post('/:id/suspend', requireAdmin, (req, res) => {
  const target = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!target) return res.status(404).json({ error: 'User not found' });
  if (target.role === 'admin') return res.status(400).json({ error: 'Cannot suspend an admin user' });
  if (req.user.id === target.id) return res.status(400).json({ error: 'Cannot suspend yourself' });

  db.prepare('UPDATE users SET suspended = ? WHERE id = ?').run(target.suspended ? 0 : 1, target.id);
  const user = toUser(db.prepare('SELECT * FROM users WHERE id = ?').get(target.id));
  res.json({ user });
});

module.exports = router;
