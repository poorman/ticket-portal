const express = require('express');
const { db, toNotification } = require('../db');
const { requireAuth } = require('../auth');

const router = express.Router();

// GET /api/notifications
router.get('/', requireAuth, (req, res) => {
  const rows = db.prepare(
    'SELECT * FROM notifications WHERE user_id = ? OR user_id IS NULL ORDER BY created_at DESC LIMIT 50'
  ).all(req.user.id);
  res.json({ notifications: rows.map(toNotification) });
});

// POST /api/notifications/:id/read
router.post('/:id/read', requireAuth, (req, res) => {
  db.prepare('UPDATE notifications SET read = 1 WHERE id = ? AND (user_id = ? OR user_id IS NULL)').run(req.params.id, req.user.id);
  res.json({ success: true });
});

// POST /api/notifications/read-all
router.post('/read-all', requireAuth, (req, res) => {
  db.prepare('UPDATE notifications SET read = 1 WHERE user_id = ? OR user_id IS NULL').run(req.user.id);
  res.json({ success: true });
});

// DELETE /api/notifications
router.delete('/', requireAuth, (req, res) => {
  db.prepare('DELETE FROM notifications WHERE user_id = ? OR user_id IS NULL').run(req.user.id);
  res.json({ success: true });
});

module.exports = router;
