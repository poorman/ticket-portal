const express = require('express');
const { db, toTicket, toResponse } = require('../db');
const { optionalAuth, requireAuth, requireAdmin } = require('../auth');

const router = express.Router();

function getNextTicketNumber() {
  const row = db.prepare("SELECT MAX(CAST(SUBSTR(ticket_number, 5) AS INTEGER)) as max_num FROM tickets").get();
  return (row.max_num || 1000) + 1;
}

function addNotification(userId, message, ticketNumber, ticketId, type) {
  db.prepare(
    'INSERT INTO notifications (user_id, message, ticket_number, ticket_id, type, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(userId, message, ticketNumber, ticketId, type, new Date().toISOString());
}

// GET /api/tickets — list all tickets
router.get('/', optionalAuth, (req, res) => {
  let rows;
  if (req.user && req.user.role === 'admin') {
    rows = db.prepare('SELECT * FROM tickets ORDER BY updated_at DESC').all();
  } else if (req.user) {
    rows = db.prepare('SELECT * FROM tickets WHERE user_id = ? OR LOWER(submitter_email) = LOWER(?) ORDER BY updated_at DESC')
      .all(req.user.id, req.user.email);
  } else {
    rows = db.prepare('SELECT * FROM tickets ORDER BY updated_at DESC').all();
  }
  const tickets = rows.map(toTicket);

  // Also return response counts
  const countStmt = db.prepare('SELECT ticket_id, COUNT(*) as count FROM responses GROUP BY ticket_id');
  const counts = {};
  for (const row of countStmt.all()) {
    counts[row.ticket_id] = row.count;
  }

  res.json({ tickets, responseCounts: counts });
});

// GET /api/tickets/search — deep search
router.get('/search', optionalAuth, (req, res) => {
  const query = (req.query.q || '').toLowerCase();
  const terms = query.split(/\s+/).filter(Boolean);
  if (!terms.length) return res.json({ results: [] });

  const tickets = db.prepare('SELECT * FROM tickets ORDER BY updated_at DESC').all();
  const allResponses = db.prepare('SELECT * FROM responses WHERE is_internal = 0').all();
  const results = [];

  for (const row of tickets) {
    const ticket = toTicket(row);
    const matchedIn = [];
    let score = 0;

    for (const term of terms) {
      if (ticket.ticketNumber.toLowerCase().includes(term)) {
        if (!matchedIn.includes('ticketNumber')) matchedIn.push('ticketNumber');
        score += 10;
      }
      if (ticket.subject.toLowerCase().includes(term)) {
        if (!matchedIn.includes('subject')) matchedIn.push('subject');
        score += 5;
      }
      if (ticket.description.toLowerCase().includes(term)) {
        if (!matchedIn.includes('description')) matchedIn.push('description');
        score += 3;
      }
    }

    const ticketResponses = allResponses.filter((r) => r.ticket_id === row.id);
    let responseSnippet;
    for (const resp of ticketResponses) {
      const msgLower = resp.message.toLowerCase();
      for (const term of terms) {
        if (msgLower.includes(term)) {
          if (!matchedIn.includes('response')) matchedIn.push('response');
          score += 2;
          if (!responseSnippet) {
            const idx = msgLower.indexOf(term);
            const start = Math.max(0, idx - 60);
            const end = Math.min(resp.message.length, idx + term.length + 60);
            responseSnippet = (start > 0 ? '...' : '') + resp.message.slice(start, end) + (end < resp.message.length ? '...' : '');
          }
          break;
        }
      }
    }

    if (ticket.status === 'resolved') score += 3;

    if (matchedIn.length > 0) {
      results.push({ ticket, matchedIn, responseSnippet, relevanceScore: score });
    }
  }

  results.sort((a, b) => b.relevanceScore - a.relevanceScore);
  res.json({ results });
});

// GET /api/tickets/by-number/:num — lookup by ticket number (for track page)
router.get('/by-number/:num', optionalAuth, (req, res) => {
  const row = db.prepare('SELECT * FROM tickets WHERE LOWER(ticket_number) = LOWER(?)').get(req.params.num);
  if (!row) return res.status(404).json({ error: 'Ticket not found' });
  res.json({ ticket: toTicket(row) });
});

// GET /api/tickets/:id — get single ticket with responses
router.get('/:id', optionalAuth, (req, res) => {
  const row = db.prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Ticket not found' });

  const includeInternal = req.user && req.user.role === 'admin';
  const responseRows = includeInternal
    ? db.prepare('SELECT * FROM responses WHERE ticket_id = ? ORDER BY created_at ASC').all(row.id)
    : db.prepare('SELECT * FROM responses WHERE ticket_id = ? AND is_internal = 0 ORDER BY created_at ASC').all(row.id);

  res.json({
    ticket: toTicket(row),
    responses: responseRows.map(toResponse),
  });
});

// POST /api/tickets — create ticket
router.post('/', optionalAuth, (req, res) => {
  const { type, subject, description, submitterName, submitterEmail, submitterPhone, userId, assignedTo, ccEmails, priority, images } = req.body;
  if (!subject || !description || !submitterName || !submitterEmail) {
    return res.status(400).json({ error: 'Subject, description, name, and email are required' });
  }

  const now = new Date().toISOString();
  const ticketNumber = `TKT-${getNextTicketNumber()}`;
  const result = db.prepare(`
    INSERT INTO tickets (ticket_number, type, subject, description, submitter_name, submitter_email, submitter_phone, user_id, assigned_to, cc_emails, status, priority, images, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', ?, ?, ?, ?)
  `).run(
    ticketNumber,
    type || 'general',
    subject,
    description,
    submitterName,
    submitterEmail,
    submitterPhone || '',
    userId || null,
    JSON.stringify(assignedTo || []),
    JSON.stringify(ccEmails || []),
    priority || 'medium',
    JSON.stringify(images || []),
    now,
    now
  );

  const ticket = toTicket(db.prepare('SELECT * FROM tickets WHERE id = ?').get(result.lastInsertRowid));

  // Notify all admins
  const admins = db.prepare("SELECT id FROM users WHERE role = 'admin'").all();
  for (const admin of admins) {
    addNotification(admin.id, `New ticket created: ${subject}`, ticketNumber, ticket.id, 'ticket_created');
  }

  res.status(201).json({ ticket });
});

// PUT /api/tickets/:id — update ticket (status/priority)
router.put('/:id', requireAdmin, (req, res) => {
  const { status, priority } = req.body;
  const row = db.prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Ticket not found' });

  const now = new Date().toISOString();
  const closedAt = status === 'resolved' ? now : (status ? null : row.closed_at);
  const isResolved = status === 'resolved';

  db.prepare('UPDATE tickets SET status = ?, priority = ?, updated_at = ?, closed_at = ? WHERE id = ?')
    .run(status ?? row.status, priority ?? row.priority, now, closedAt, row.id);

  const ticket = toTicket(db.prepare('SELECT * FROM tickets WHERE id = ?').get(row.id));

  // Notify ticket owner
  if (row.user_id) {
    addNotification(
      row.user_id,
      isResolved ? 'Ticket resolved' : `Ticket updated${status ? ` to ${status.replace('_', ' ')}` : ''}`,
      row.ticket_number, row.id,
      isResolved ? 'ticket_resolved' : 'ticket_updated'
    );
  }

  res.json({ ticket });
});

// POST /api/tickets/:id/resolve — resolve ticket (for submitter/assignee)
router.post('/:id/resolve', optionalAuth, (req, res) => {
  const row = db.prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Ticket not found' });

  const now = new Date().toISOString();
  db.prepare('UPDATE tickets SET status = ?, updated_at = ?, closed_at = ? WHERE id = ?')
    .run('resolved', now, now, row.id);

  const ticket = toTicket(db.prepare('SELECT * FROM tickets WHERE id = ?').get(row.id));
  res.json({ ticket });
});

// DELETE /api/tickets/:id
router.delete('/:id', requireAdmin, (req, res) => {
  const row = db.prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Ticket not found' });
  db.prepare('DELETE FROM tickets WHERE id = ?').run(row.id);
  res.json({ success: true });
});

// POST /api/tickets/:id/responses — add response
router.post('/:id/responses', optionalAuth, (req, res) => {
  const { userId, userName, userRole, message, images, isInternal } = req.body;
  const ticketRow = db.prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.id);
  if (!ticketRow) return res.status(404).json({ error: 'Ticket not found' });
  if (!message || !message.trim()) return res.status(400).json({ error: 'Message required' });

  const now = new Date().toISOString();
  const result = db.prepare(`
    INSERT INTO responses (ticket_id, user_id, user_name, user_role, message, images, is_internal, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    ticketRow.id,
    userId || null,
    userName || '',
    userRole || 'user',
    message.trim(),
    JSON.stringify(images || []),
    isInternal ? 1 : 0,
    now
  );

  // Update ticket's updatedAt
  db.prepare('UPDATE tickets SET updated_at = ? WHERE id = ?').run(now, ticketRow.id);

  const response = toResponse(db.prepare('SELECT * FROM responses WHERE id = ?').get(result.lastInsertRowid));

  // Notify ticket owner if not internal
  if (!isInternal && ticketRow.user_id) {
    addNotification(
      ticketRow.user_id,
      `New response from ${userName || 'Anonymous'}`,
      ticketRow.ticket_number, ticketRow.id,
      'response_added'
    );
  }

  res.status(201).json({ response });
});

// DELETE /api/responses/:id
router.delete('/responses/:id', requireAdmin, (req, res) => {
  const row = db.prepare('SELECT * FROM responses WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Response not found' });
  db.prepare('DELETE FROM responses WHERE id = ?').run(row.id);
  res.json({ success: true });
});

// GET /api/tickets/:id/responses — get responses for a ticket
router.get('/:id/responses', optionalAuth, (req, res) => {
  const includeInternal = req.user && req.user.role === 'admin';
  const rows = includeInternal
    ? db.prepare('SELECT * FROM responses WHERE ticket_id = ? ORDER BY created_at ASC').all(req.params.id)
    : db.prepare('SELECT * FROM responses WHERE ticket_id = ? AND is_internal = 0 ORDER BY created_at ASC').all(req.params.id);
  res.json({ responses: rows.map(toResponse) });
});

module.exports = router;
