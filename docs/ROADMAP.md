# Roadmap

Items remaining to complete the rewrite and potential future enhancements.

---

## Immediate (Rewrite Completion)

These items are needed to finish the Next.js-to-Vite migration:

- [ ] **Production build verification** -- Run `npm run build` and `npm run preview` to confirm the static output works correctly
- [ ] **Dev server smoke test** -- Run `npm run dev` and manually test all 10 routes
- [ ] **Docker deployment files** -- Create `nginx.conf`, `Dockerfile` (multi-stage node build + nginx), `docker-compose.yml`, `.dockerignore`
- [ ] **Clean up legacy files** -- Remove leftover `.env`, `.env.development`, `.env.example` files from the old Next.js project
- [ ] **Update .gitignore** -- Ensure `dist/`, `node_modules/`, `.env` are covered for the Vite project
- [ ] **Update CLAUDE.md** -- Reflect the new tech stack, commands (`npm run dev`, `npm run build`), and project structure

---

## Short-Term Enhancements

- [ ] **Seed sample data** -- Create a `src/lib/seed.ts` that populates 5-10 demo tickets on first load so the app doesn't start empty
- [ ] **Responsive polish** -- Test and fix mobile layouts for all pages, especially TicketTable and AdminTicketDetailPage sidebar
- [ ] **Accessibility** -- Add ARIA labels to interactive elements, ensure keyboard navigation works, check color contrast ratios
- [ ] **Error boundary** -- Add a React error boundary component wrapping `<Outlet />` for graceful crash recovery
- [ ] **Loading states** -- Add skeleton/shimmer placeholders during store rehydration

---

## Medium-Term Features

- [ ] **Assignee system** -- Add an `assignedTo` field on tickets, implement the AssignFilter dropdown that currently exists as a placeholder
- [ ] **Ticket filtering** -- Filter by status, priority, type, and date range on HomePage and AdminDashboardPage
- [ ] **Pagination** -- Virtual scrolling or page-based pagination for large ticket lists
- [ ] **Notification center** -- In-app notification panel tracking ticket updates (replacing simulated email toasts)
- [ ] **Dark mode** -- Toggle between light and dark themes using Tailwind's `dark:` variant
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
- [ ] **Image compression** -- Compress images client-side before base64 encoding to reduce storage footprint
- [ ] **Memoization audit** -- Review `useMemo` usage in pages to prevent unnecessary re-renders on large datasets
