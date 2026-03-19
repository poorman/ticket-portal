# Roadmap

Items completed during the rewrite and potential future enhancements.

---

## Completed (Rewrite)

These items were completed as part of the Next.js-to-Vite migration:

- [x] **Production build verification** -- `npm run build` and `npm run preview` confirmed working
- [x] **Dev server smoke test** -- All 10 routes tested and functional
- [x] **Docker deployment files** -- `nginx.conf`, `Dockerfile` (multi-stage node build + nginx), `docker-compose.yml`, `.dockerignore` created
- [x] **Clean up legacy files** -- Removed leftover `.env`, `.env.development`, `.env.example` files
- [x] **Update .gitignore** -- Covers `dist/`, `node_modules/`, `.env` for Vite project
- [x] **Update CLAUDE.md** -- Reflects the new tech stack and commands
- [x] **Dark glassmorphism redesign** -- Full visual overhaul with dark theme and glass-effect UI
- [x] **Knowledge Base search page** -- Added SearchPage at `/search`

---

## Short-Term Enhancements

- [ ] **Seed sample data** -- Create a `src/lib/seed.ts` that populates 5-10 demo tickets on first load so the app doesn't start empty
- [x] **Responsive polish** -- Mobile card view for TicketTable, admin sidebar reordered first on mobile, flex-wrap on badges/timestamps, responsive thumbnails and stat cards
- [ ] **Accessibility** -- Add ARIA labels to interactive elements, ensure keyboard navigation works, check color contrast ratios
- [ ] **Error boundary** -- Add a React error boundary component wrapping `<Outlet />` for graceful crash recovery
- [ ] **Loading states** -- Add skeleton/shimmer placeholders during store rehydration

---

## Medium-Term Features

- [ ] **Assignee system** -- Add an `assignedTo` field on tickets, implement the AssignFilter dropdown that currently exists as a placeholder
- [ ] **Ticket filtering** -- Filter by status, priority, type, and date range on HomePage and AdminDashboardPage
- [x] **Pagination** -- Page-based pagination (10 per page) on TicketTable for both mobile cards and desktop table views
- [x] **Notification center** -- In-app notification panel in Navbar with bell icon, unread badge, mark-read/clear; fires on ticket create, update, response, and close via `notificationStore`
- [ ] **Export/Import** -- JSON export of all localStorage data for backup; import to restore state

---

## Long-Term / Backend Migration

If the app needs to support real multi-user workflows:

- [ ] **Backend API** -- Add an Express/Fastify backend with the same REST endpoints the old Next.js app had
- [ ] **Database** -- Restore PostgreSQL + Prisma for persistent multi-user storage
- [ ] **Real authentication** -- Replace btoa/atob with bcrypt password hashing and JWT tokens
- [ ] **Email notifications** -- Restore Nodemailer integration for ticket creation and update emails
- [ ] **File storage** -- Move image uploads from base64 localStorage to S3/local disk with URL references
- [ ] **WebSocket updates** -- Real-time ticket updates for admin users
- [ ] **Audit log** -- Track all ticket state changes with timestamps and actor information

---

## Performance

- [ ] **Code splitting** -- Lazy-load page components with `React.lazy()` + `Suspense` to reduce initial bundle size
- [ ] **localStorage limits** -- Add storage quota monitoring and warn users when approaching the ~5MB browser limit
- [x] **Image compression** -- Canvas-based compression: resizes to max 1920px, JPEG at 80% quality; shows spinner during compress; 10MB raw upload limit
- [ ] **Memoization audit** -- Review `useMemo` usage in pages to prevent unnecessary re-renders on large datasets
