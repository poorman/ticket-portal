# Roadmap

Items completed and potential future enhancements.

---

## Completed

- [x] **React + Vite SPA rewrite** — Migrated from Next.js to React 18 + Vite 6
- [x] **Dark glassmorphism redesign** — Full visual overhaul with dark theme and glass-effect UI
- [x] **Knowledge Base search page** — SearchPage at `/search` with deep search
- [x] **Docker deployment** — nginx + Docker multi-stage build
- [x] **Admin features** — Respond as user, submit as user, delete responses, user management panel
- [x] **@mention system** — @mention detection with autocomplete dropdown, email notification toasts, gold highlighting
- [x] **Ticket assignment** — Assigned To and CC fields with user picker dropdowns
- [x] **Notification center** — In-app notifications with bell icon and unread count
- [x] **Pagination** — Page-based pagination (10 per page) on ticket tables
- [x] **Unread tracking** — Gold "NEW" badge on tickets with unseen responses
- [x] **Resolve workflow** — "Resolve It" button for submitters/assignees with confetti animation
- [x] **Response highlighting** — Ticket creator responses subtly highlighted
- [x] **User popover** — Click user names in responses to see user details
- [x] **Backend API** — Express.js + SQLite backend with JWT authentication
- [x] **Database persistence** — All data stored in SQLite, shared across devices/browsers
- [x] **Real authentication** — bcrypt password hashing, JWT tokens
- [x] **Docker multi-service** — Separate frontend (nginx) and API (Node.js) containers

---

## Short-Term Enhancements

- [ ] **Seed sample data** — Create a seed script that populates demo tickets so the app doesn't start empty
- [ ] **Accessibility** — Add ARIA labels, keyboard navigation, color contrast audit
- [ ] **Error boundary** — React error boundary for graceful crash recovery
- [ ] **Loading skeletons** — Skeleton placeholders during API data fetching

---

## Medium-Term Features

- [ ] **Ticket filtering** — Filter by status, priority, type, and date range
- [ ] **Export/Import** — JSON/CSV export of tickets for backup and reporting
- [ ] **Email notifications** — Nodemailer integration for real email delivery on ticket events
- [ ] **File storage** — Move image uploads from base64 in DB to file-based storage (multer + disk/S3)

---

## Long-Term

- [ ] **WebSocket updates** — Real-time ticket updates for admin users
- [ ] **Audit log** — Track all ticket state changes with timestamps and actor info
- [ ] **Full-text search** — SQLite FTS5 for faster and more accurate search results
- [ ] **Code splitting** — Lazy-load page components with `React.lazy()` + `Suspense`
- [ ] **Role-based permissions** — More granular roles beyond user/admin
