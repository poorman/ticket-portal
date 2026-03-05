# Decisions

Key architectural and technical decisions made during the project, with rationale.

---

## 1. Client-Side Only (No Backend)

**Decision:** All data persisted to localStorage via Zustand. No server, database, or API.

**Rationale:** The app was rewritten from a Next.js full-stack app (Prisma + PostgreSQL + NextAuth) to a pure SPA. The goal was a lightweight, self-contained demo that can run anywhere without infrastructure dependencies. Trade-off: no multi-user sync, no real email notifications, limited storage capacity (~5-10MB).

**Consequences:**
- Email notifications are simulated as toast messages
- File uploads stored as base64 data URLs (increases localStorage usage)
- Passwords use simple base64 encoding (btoa), not bcrypt
- All users see the same data only on the same browser

---

## 2. Zustand Over Redux/Context

**Decision:** Zustand for all state management.

**Rationale:** Zustand provides a minimal API with built-in `persist` middleware for localStorage. No boilerplate (reducers, actions, providers). Stores are plain functions callable from anywhere, including outside React components via `getState()`. Three separate stores keep concerns isolated without a global provider tree.

---

## 3. React Router v6 With Hook-Based Route Guards

**Decision:** Route protection via `useRequireAuth` hook inside page components, not wrapper `<Route>` elements.

**Rationale:** Simpler than higher-order route components. The hook checks `authStore.currentUser` and calls `navigate()` on mismatch. Pages that need admin access pass `useRequireAuth(true)`. This avoids nested route configurations and keeps auth logic co-located with the page that needs it.

---

## 4. TailwindCSS With Custom Component Classes

**Decision:** TailwindCSS 3.4 with `@layer components` for reusable class groups (`.btn`, `.card`, `.input`, etc.) defined in `src/index.css`.

**Rationale:** Avoids repeating long Tailwind class strings across components while keeping the styling system utility-first. Custom classes are scoped to the components layer so they can be overridden with utility classes when needed.

---

## 5. Framer Motion for Page Transitions

**Decision:** Every page wrapped in `<AnimatedPage>` which applies fade + slide-up on mount/unmount.

**Rationale:** Provides a polished feel with minimal code. `AnimatePresence` in `App.tsx` coordinates exit animations. Individual list items (ticket rows, response bubbles) also use staggered Framer Motion animations.

---

## 6. Separate Ticket and Response Collections

**Decision:** Tickets and responses stored as two flat arrays in `ticketStore`, linked by `ticketId`.

**Rationale:** Mirrors the original relational database schema (Ticket has-many TicketResponse). Flat arrays are simpler to persist and filter than nested structures. Cascade delete is handled manually in `deleteTicket()` by filtering out matching responses.

---

## 7. Ticket Number Auto-Increment

**Decision:** Ticket numbers follow `TKT-{N}` format starting at 1001, with a counter in the store.

**Rationale:** Ported directly from the original system. The counter (`nextTicketNumber`) persists in localStorage, ensuring unique sequential numbers across sessions.

---

## 8. Base64 Image Storage

**Decision:** Image attachments converted to base64 data URLs and stored inline in ticket/response objects.

**Rationale:** No server-side file storage available. Base64 encoding allows images to persist in localStorage alongside ticket data. Downside: inflates storage size (~33% overhead). Limited to 5 images per upload, 5MB each, with client-side validation.

---

## 9. Crane Network Branding Via Tailwind Theme Extension

**Decision:** Brand colors defined as custom Tailwind colors (`crane`, `crane-dark`, `crane-light`, `crane-lighter`) plus status colors in `tailwind.config.js`.

**Rationale:** Centralizes the color palette. Components use semantic names (`bg-crane`, `text-status-open`) rather than hex values, making future rebrand a single-file change.

---

## 10. Docker + nginx for Production

**Decision:** Multi-stage Docker build (Node for build, nginx for serve).

**Rationale:** SPA produces static files -- nginx is the optimal server for this. SPA fallback (`try_files $uri /index.html`) handles client-side routing. No Node.js runtime needed in production.
