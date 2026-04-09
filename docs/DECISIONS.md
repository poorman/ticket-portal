# Decisions

Key architectural and technical decisions made during the project, with rationale.

---

## 1. Express.js + SQLite Backend

**Decision:** Full-stack architecture with Express.js API and SQLite (better-sqlite3) for persistent storage.

**Rationale:** Originally a client-side-only SPA with localStorage. Migrated to a real backend to enable multi-device access, shared data across browsers, and proper authentication. SQLite chosen for zero-config deployment — no separate database server needed. better-sqlite3 provides synchronous, fast access without connection pooling overhead.

**Consequences:**
- Data persists across devices and browsers
- Real bcrypt password hashing and JWT authentication
- Docker volume ensures data survives container rebuilds
- SQLite file-level locking sufficient for expected concurrency

---

## 2. Zustand for State Management

**Decision:** Zustand stores backed by async API calls for all state management.

**Rationale:** Zustand provides minimal API with no boilerplate. Stores migrated from localStorage `persist` middleware to async API-backed pattern. Components don't need to know about the backend — they call store methods that internally make API requests. Three main stores (auth, tickets, notifications) plus two client-only stores (read tracking, UI state).

---

## 3. JWT Authentication With localStorage

**Decision:** JWT tokens stored in `localStorage('auth-token')`, attached to all API requests via Bearer header.

**Rationale:** Simple, stateless auth that works across page reloads. The API client (`src/lib/api.ts`) automatically attaches the token. On app load, `authStore.initialize()` validates the stored token via `GET /api/auth/me`. Token expiry handled server-side (7-day TTL).

---

## 4. Two-Service Docker Compose

**Decision:** Separate containers for frontend (nginx) and backend (Node.js API), connected via Docker network.

**Rationale:** nginx serves the static Vite build and proxies `/api/` requests to the API container. This separates concerns cleanly — frontend can be rebuilt without touching the API, and vice versa. SQLite database persisted via named Docker volume (`db-data`).

---

## 5. Activity Tracking Table

**Decision:** Dedicated `ticket_activity` table for logging all ticket events (created, assigned, status changes, mentions).

**Rationale:** Provides an audit trail visible in the ticket detail sidebar. Activities are logged server-side on ticket creation, updates, resolution, and @mentions. Displayed with colored dots per action type.

---

## 6. Inline Image Paste From Rich Content

**Decision:** Support pasting images and rich HTML content (Gmail) directly into textareas, rendered inline via `{{img:N}}` placeholders.

**Rationale:** Users frequently copy content from emails to create tickets. The paste handler (`paste-utils.ts`) parses HTML clipboard data, extracts `<img>` tags, converts them to base64 via canvas, and inserts placeholders. Images stored in the ticket's `images[]` array. `DescriptionWithEmbeds` renders placeholders as inline `<img>` tags alongside Loom video embeds.

---

## 7. Loom Video Embed Detection

**Decision:** Automatically detect Loom share URLs in ticket descriptions and render them as embedded video players.

**Rationale:** Many support tickets include Loom screen recordings. Auto-embedding lets users watch without leaving the portal. Detection uses regex matching on `loom.com/share/{id}` patterns, rendering as responsive 16:9 iframes.

---

## 8. Profile Avatar With Base64 Storage

**Decision:** User avatars stored as base64 data URLs in the `users.avatar` column.

**Rationale:** Simplest approach for a small user base. No external file storage or CDN needed. Upload limited to 2MB. Displayed in navbar dropdown, ticket detail sidebar, and response timeline. Fallback: generic user icon.

---

## 9. @Mention Server-Side Processing

**Decision:** @mention detection handled server-side when creating responses, not just client-side.

**Rationale:** Server creates notifications for mentioned users and logs activity ("User1 notified User2"). Mentioned users gain permission to resolve/edit the ticket. Client-side autocomplete assists with username selection, but the server is the authority on who gets notified.

---

## 10. Crane Network Branding Via Tailwind Theme

**Decision:** Brand colors defined as custom Tailwind colors (`crane`, `crane-dark`, `crane-light`, `crane-lighter`) plus status colors in `tailwind.config.js`. Dark gradient background using `#161419`, `#161519`, `#141317`, `#121114`.

**Rationale:** Centralizes the color palette. Components use semantic names (`bg-crane`, `text-status-open`) rather than hex values. Gold gradient buttons use radial-gradient CSS for the premium look.
