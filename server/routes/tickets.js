const express = require('express');
const { db, toTicket, toResponse, toActivity, addActivity } = require('../db');
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
  const portal = req.query.portal || 'crane';
  const rows = db.prepare('SELECT * FROM tickets WHERE portal = ? ORDER BY updated_at DESC').all(portal);
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

  const searchPortal = req.query.portal || 'crane';
  const tickets = db.prepare('SELECT * FROM tickets WHERE portal = ? ORDER BY updated_at DESC').all(searchPortal);
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

  const activityRows = db.prepare('SELECT * FROM ticket_activity WHERE ticket_id = ? ORDER BY created_at ASC').all(row.id);

  res.json({
    ticket: toTicket(row),
    responses: responseRows.map(toResponse),
    activities: activityRows.map(toActivity),
  });
});

// POST /api/tickets — create ticket
router.post('/', optionalAuth, (req, res) => {
  const { type, subject, description, submitterName, submitterEmail, submitterPhone, userId, assignedTo, ccEmails, priority, images, portal } = req.body;
  if (!subject || !description || !submitterName || !submitterEmail) {
    return res.status(400).json({ error: 'Subject, description, name, and email are required' });
  }

  const now = new Date().toISOString();
  const ticketNumber = `TKT-${getNextTicketNumber()}`;
  const result = db.prepare(`
    INSERT INTO tickets (ticket_number, type, subject, description, submitter_name, submitter_email, submitter_phone, user_id, assigned_to, cc_emails, status, priority, images, portal, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', ?, ?, ?, ?, ?)
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
    portal || 'crane',
    now,
    now
  );

  const ticket = toTicket(db.prepare('SELECT * FROM tickets WHERE id = ?').get(result.lastInsertRowid));

  // Log activity
  addActivity(ticket.id, userId || null, submitterName, 'created', 'Ticket created');
  if (assignedTo && assignedTo.length > 0) {
    for (const username of assignedTo) {
      addActivity(ticket.id, userId || null, submitterName, 'assigned', `Assigned to ${username}`);
    }
  }
  if (priority && priority !== 'medium') {
    addActivity(ticket.id, userId || null, submitterName, 'priority_set', `Priority set to ${priority.charAt(0).toUpperCase() + priority.slice(1)}`);
  }

  // Notify all admins
  const admins = db.prepare("SELECT id FROM users WHERE role = 'admin'").all();
  for (const admin of admins) {
    addNotification(admin.id, `New ticket created: ${subject}`, ticketNumber, ticket.id, 'ticket_created');
  }

  res.status(201).json({ ticket });
});

// PUT /api/tickets/:id — update ticket (admin or ticket owner)
router.put('/:id', requireAuth, (req, res) => {
  const { status, priority, subject, description, assignedTo, ccEmails, createdAt } = req.body;
  const row = db.prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Ticket not found' });

  const isOwner = req.user.id === row.user_id || req.user.email.toLowerCase() === row.submitter_email.toLowerCase();
  if (req.user.role !== 'admin' && !isOwner) {
    return res.status(403).json({ error: 'Not authorized to edit this ticket' });
  }

  const now = new Date().toISOString();
  const newStatus = status ?? row.status;
  const closedAt = newStatus === 'resolved' ? now : (status ? null : row.closed_at);
  const isResolved = newStatus === 'resolved' && row.status !== 'resolved';

  // Admin can edit creation date
  const newCreatedAt = (createdAt && req.user.role === 'admin') ? createdAt : row.created_at;

  db.prepare(`UPDATE tickets SET subject = ?, description = ?, status = ?, priority = ?, assigned_to = ?, cc_emails = ?, created_at = ?, updated_at = ?, closed_at = ? WHERE id = ?`)
    .run(
      subject ?? row.subject,
      description ?? row.description,
      newStatus,
      priority ?? row.priority,
      assignedTo !== undefined ? JSON.stringify(assignedTo) : row.assigned_to,
      ccEmails !== undefined ? JSON.stringify(ccEmails) : row.cc_emails,
      newCreatedAt,
      now,
      closedAt,
      row.id
    );

  const ticket = toTicket(db.prepare('SELECT * FROM tickets WHERE id = ?').get(row.id));

  // Log activity
  const actorName = req.user.name || req.user.username;
  if (status && status !== row.status) {
    const display = status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    addActivity(row.id, req.user.id, actorName, 'status_changed', `Status set to ${display}`);
  }
  if (priority && priority !== row.priority) {
    addActivity(row.id, req.user.id, actorName, 'priority_changed', `Priority set to ${priority.charAt(0).toUpperCase() + priority.slice(1)}`);
  }
  if (assignedTo !== undefined) {
    const oldAssigned = JSON.parse(row.assigned_to || '[]');
    const newAssigned = assignedTo.filter((u) => !oldAssigned.includes(u));
    for (const username of newAssigned) {
      addActivity(row.id, req.user.id, actorName, 'assigned', `Assigned to ${username}`);
    }
  }

  // Notify ticket owner if someone else edited
  if (row.user_id && req.user.id !== row.user_id) {
    addNotification(
      row.user_id,
      isResolved ? 'Ticket resolved' : `Ticket updated${status ? ` to ${status.replace('_', ' ')}` : ''}`,
      row.ticket_number, row.id,
      isResolved ? 'ticket_resolved' : 'ticket_updated'
    );
  }

  res.json({ ticket });
});

// POST /api/tickets/:id/resolve — resolve ticket (submitter/assignee/mentioned/admin)
router.post('/:id/resolve', optionalAuth, (req, res) => {
  const row = db.prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Ticket not found' });

  const now = new Date().toISOString();
  db.prepare('UPDATE tickets SET status = ?, updated_at = ?, closed_at = ? WHERE id = ?')
    .run('resolved', now, now, row.id);

  const actorName = req.user ? (req.user.name || req.user.username) : 'User';
  addActivity(row.id, req.user ? req.user.id : null, actorName, 'status_changed', 'Status set to Resolved');

  const ticket = toTicket(db.prepare('SELECT * FROM tickets WHERE id = ?').get(row.id));
  res.json({ ticket });
});

// DELETE /api/tickets/:id
router.delete('/:id', requireAuth, (req, res) => {
  const row = db.prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Ticket not found' });
  const isAdmin = req.user.role === 'admin';
  const isOwner = row.user_id && row.user_id === req.user.id;
  if (!isAdmin && !isOwner) return res.status(403).json({ error: 'Not authorized to delete this ticket' });
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
  if (!isInternal && ticketRow.user_id && ticketRow.user_id !== (userId || null)) {
    addNotification(
      ticketRow.user_id,
      `New response from ${userName || 'Anonymous'}`,
      ticketRow.ticket_number, ticketRow.id,
      'response_added'
    );
  }

  // Detect @mentions and notify/log activity
  if (!isInternal) {
    const mentions = (message.match(/@(\w+)/g) || []).map((m) => m.slice(1).toLowerCase());
    if (mentions.length > 0) {
      const allUsers = db.prepare('SELECT * FROM users').all();
      const responderName = userName || 'Someone';
      for (const mentionName of mentions) {
        const mentionedUser = allUsers.find((u) =>
          u.username.toLowerCase() === mentionName ||
          u.name.toLowerCase().includes(mentionName)
        );
        if (mentionedUser) {
          // Notify the mentioned user
          addNotification(
            mentionedUser.id,
            `${responderName} mentioned you in ${ticketRow.ticket_number}`,
            ticketRow.ticket_number, ticketRow.id,
            'response_added'
          );
          // Log activity
          addActivity(ticketRow.id, userId || null, responderName, 'mentioned', `${responderName} notified ${mentionedUser.name}`);
        }
      }
    }
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
