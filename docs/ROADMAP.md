# Roadmap

Items completed and potential future enhancements.

---

## Completed

- [x] **React + Vite SPA rewrite** — Migrated from Next.js to React 18 + Vite 6
- [x] **Dark glassmorphism redesign** — Full visual overhaul with dark gradient background
- [x] **Knowledge Base search page** — SearchPage at `/search` with deep search and relevance scoring
- [x] **Docker deployment** — Two-service Docker Compose (nginx frontend + Node.js API)
- [x] **Admin features** — Respond as user, submit as user, delete responses, user management panel
- [x] **@mention system** — @mention detection with autocomplete dropdown, server-side notifications, gold highlighting
- [x] **Ticket assignment** — Assigned To and CC fields with user picker dropdowns
- [x] **Notification center** — In-app notifications with bell icon and unread count
- [x] **Pagination** — Page-based pagination (10 per page) on ticket tables
- [x] **Unread tracking** — Gold "NEW" badge on tickets with unseen responses
- [x] **Resolve workflow** — "Resolve It" button for submitters/assignees/mentioned users with confetti animation
- [x] **Response highlighting** — Ticket creator responses with "Author" badge and golden border
- [x] **User popover** — Click user names in responses to see user details
- [x] **Ticket editing** — Admin and ticket owners can edit subject, description, assigned, CC, status, priority, creation date
- [x] **Loom video embed** — Loom links in descriptions auto-embed as playable videos
- [x] **Image paste from clipboard** — Paste images (Ctrl+V) and rich content from Gmail directly into descriptions/responses
- [x] **Redesigned ticket detail layout** — Two-column layout with sidebar (Created, Assigned, Activity, CC), vertical divider, timeline with dots
- [x] **Profile dropdown** — Navbar avatar with dropdown menu (Profile, My Tickets, Manage Users, Sign out)
- [x] **Activity tracking** — ticket_activity table logs creation, assignment, status changes, @mention notifications
- [x] **Avatar upload** — Users can upload profile photos via Profile page
- [x] **Backend API** — Express.js + SQLite backend with JWT authentication
- [x] **Database persistence** — All data stored in SQLite, shared across devices/browsers, survives Docker rebuilds
- [x] **Real authentication** — bcrypt password hashing, JWT tokens
- [x] **Docker multi-service** — Separate frontend (nginx) and API (Node.js) containers with volume persistence
- [x] **Database indexes** — Indexes on tickets.user_id, tickets.ticket_number, responses.ticket_id, notifications.user_id
- [x] **Default user seeding** — 7 pre-configured users with individual passwords

---

## Short-Term Enhancements

- [ ] **Accessibility** — Add ARIA labels, keyboard navigation, color contrast audit
- [ ] **Error boundary** — React error boundary for graceful crash recovery
- [ ] **Loading skeletons** — Skeleton placeholders during API data fetching
- [ ] **Email notifications** — Nodemailer integration for real email delivery on @mentions and ticket events

---

## Medium-Term Features

- [ ] **Ticket filtering** — Filter by status, priority, type, and date range on dashboard
- [ ] **Export/Import** — JSON/CSV export of tickets for backup and reporting
- [ ] **File storage** — Move image uploads from base64 in DB to file-based storage (multer + disk/S3)
- [ ] **User public profiles** — Stats page showing tickets requested, resolved, response count

---

## Long-Term

- [ ] **WebSocket updates** — Real-time ticket updates for admin users
- [ ] **Full-text search** — SQLite FTS5 for faster and more accurate search results
- [ ] **Code splitting** — Lazy-load page components with `React.lazy()` + `Suspense`
- [ ] **Role-based permissions** — More granular roles beyond user/admin
- [ ] **SLA tracking** — Response time targets with visual indicators
