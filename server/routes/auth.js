const express = require('express');
const bcrypt = require('bcryptjs');
const { db, toUser } = require('../db');
const { signToken, requireAuth } = require('../auth');

const router = express.Router();

// Generate username from email
function generateUsername(email) {
  const base = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
  let candidate = base;
  let counter = 1;
  while (db.prepare('SELECT 1 FROM users WHERE username = ?').get(candidate)) {
    candidate = `${base}${counter}`;
    counter++;
  }
  return candidate;
}

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const input = email.toLowerCase();
  const row = db.prepare('SELECT * FROM users WHERE LOWER(email) = ? OR username = ?').get(input, input);
  if (!row) return res.status(401).json({ error: 'Invalid credentials' });
  if (row.suspended) return res.status(403).json({ error: 'Account suspended' });
  if (!bcrypt.compareSync(password, row.password)) return res.status(401).json({ error: 'Invalid credentials' });

  db.prepare('UPDATE users SET last_login_at = ? WHERE id = ?').run(new Date().toISOString(), row.id);
  const token = signToken(row.id);
  const user = toUser({ ...row, last_login_at: new Date().toISOString() });
  res.json({ token, user });
});

// POST /api/auth/register
router.post('/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Name, email, and password required' });

  const existing = db.prepare('SELECT 1 FROM users WHERE LOWER(email) = ?').get(email.toLowerCase());
  if (existing) return res.status(409).json({ error: 'A user with this email already exists' });

  const hash = bcrypt.hashSync(password, 10);
  const username = generateUsername(email);
  const now = new Date().toISOString();
  const result = db.prepare(
    'INSERT INTO users (username, email, password, name, role, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(username, email, hash, name, 'user', now);

  const user = toUser(db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid));
  const token = signToken(user.id);
  res.status(201).json({ token, user });
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  const user = toUser(db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id));
  res.json({ user });
});

// PUT /api/auth/profile
router.put('/profile', requireAuth, (req, res) => {
  const { name, email, password, phone } = req.body;
  const current = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);

  if (email && email.toLowerCase() !== current.email.toLowerCase()) {
    const taken = db.prepare('SELECT 1 FROM users WHERE LOWER(email) = ? AND id != ?').get(email.toLowerCase(), current.id);
    if (taken) return res.status(409).json({ error: 'A user with this email already exists' });
  }

  const updates = {
    name: name ?? current.name,
    email: email ?? current.email,
    phone: phone ?? current.phone,
    password: password ? bcrypt.hashSync(password, 10) : current.password,
  };

  db.prepare('UPDATE users SET name = ?, email = ?, phone = ?, password = ? WHERE id = ?')
    .run(updates.name, updates.email, updates.phone, updates.password, current.id);

  const user = toUser(db.prepare('SELECT * FROM users WHERE id = ?').get(current.id));
  res.json({ user });
});

// PUT /api/auth/avatar
router.put('/avatar', requireAuth, (req, res) => {
  const { avatar } = req.body;
  if (!avatar) return res.status(400).json({ error: 'Avatar data required' });

  db.prepare('UPDATE users SET avatar = ? WHERE id = ?').run(avatar, req.user.id);
  const user = toUser(db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id));
  res.json({ user });
});

module.exports = router;
module.exports.generateUsername = generateUsername;
