const jwt = require('jsonwebtoken');
const { db, toUser } = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'ticket-portal-secret-key-change-in-production';

function signToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

// Middleware: optional auth (sets req.user if valid token present)
function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    try {
      const payload = verifyToken(header.slice(7));
      const row = db.prepare('SELECT * FROM users WHERE id = ?').get(payload.userId);
      if (row && !row.suspended) {
        req.user = toUser(row, true);
      }
    } catch {
      // Invalid token — continue without auth
    }
  }
  next();
}

// Middleware: require auth
function requireAuth(req, res, next) {
  optionalAuth(req, res, () => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    next();
  });
}

// Middleware: require admin
function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    next();
  });
}

module.exports = { signToken, verifyToken, optionalAuth, requireAuth, requireAdmin, JWT_SECRET };
