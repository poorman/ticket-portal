# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Crane Network Support Portal — a ticket management system with a React SPA frontend and Express.js + SQLite backend. React 18, Vite 6, TypeScript, TailwindCSS 3.4, Zustand for state management. Backend uses Express.js with better-sqlite3 for persistent storage. JWT authentication.

## Commands

### Frontend
- **Dev server**: `npm run dev` (Vite dev server, port 5173, proxies /api to localhost:3001)
- **Build**: `npm run build` (runs `tsc -b && vite build`, outputs to `dist/`)
- **Preview**: `npm run preview` (serve production build locally)
- **Lint**: `npm run lint` (ESLint)

### Backend
- **Dev server**: `cd server && node --watch index.js` (Express API on port 3001)
- **Start**: `cd server && node index.js`

### Docker
- **Build & run**: `docker compose up -d --build`
- **Rebuild**: `docker compose up -d --build --remove-orphans`
- **Logs**: `docker logs ticket-portal-api-1` / `docker logs ticket-portal-frontend-1`

## Architecture

### Backend (Express.js + SQLite)
- `server/index.js` — Express app entry point
- `server/db.js` — SQLite connection, schema, seed data, row-to-object converters
- `server/auth.js` — JWT middleware (signToken, optionalAuth, requireAuth, requireAdmin)
- `server/routes/auth.js` — Login, register, profile endpoints
- `server/routes/users.js` — Admin user CRUD
- `server/routes/tickets.js` — Ticket CRUD, responses, search
- `server/routes/notifications.js` — Notification management

### Auth
JWT-based auth. Passwords hashed with bcrypt. Token stored in localStorage as `auth-token`. Default admin: `admin@widesurf.com` / `admin123`.

### API Endpoints
- `POST /api/auth/login` — Login, returns JWT + user
- `POST /api/auth/register` — Register new user
- `GET /api/auth/me` — Validate token, get current user
- `PUT /api/auth/profile` — Update own profile
- `GET /api/users` — List users (auth required)
- `POST /api/users` — Create user (admin)
- `PUT /api/users/:id` — Update user (admin)
- `DELETE /api/users/:id` — Delete user (admin)
- `POST /api/users/:id/suspend` — Toggle suspend (admin)
- `GET /api/tickets` — List tickets
- `POST /api/tickets` — Create ticket
- `GET /api/tickets/:id` — Get ticket with responses
- `PUT /api/tickets/:id` — Update ticket (admin or owner; supports subject, description, assignedTo, ccEmails, status, priority, createdAt)
- `DELETE /api/tickets/:id` — Delete ticket (admin)
- `POST /api/tickets/:id/resolve` — Resolve ticket (submitter/assignee/mentioned/admin)
- `POST /api/tickets/:id/responses` — Add response (detects @mentions, creates notifications + activity)
- `DELETE /api/tickets/responses/:id` — Delete response (admin)
- `GET /api/tickets/search?q=` — Deep search
- `GET /api/tickets/by-number/:num` — Lookup by ticket number
- `PUT /api/auth/avatar` — Upload user avatar (base64)
- `GET /api/notifications` — Get notifications
- `POST /api/notifications/:id/read` — Mark read
- `POST /api/notifications/read-all` — Mark all read

### State Management (Zustand)
Four stores in `src/store/`:
- **authStore** — users, session, async login/register/logout via API. Has `initialize()` for token validation on app start.
- **ticketStore** — tickets, responses, async CRUD via API. Has `fetchTickets()` and `fetchTicketDetail()`.
- **notificationStore** — notifications via API. Has `fetchNotifications()`.
- **uiStore** — search/sort/filter state. Client-side only, not persisted.
- **readStore** — per-ticket read tracking. Client-side localStorage only.

### Data Model
Defined in `src/types/index.ts`:
- **User** — email/password auth, `UserRole` enum (user/admin), optional avatar (base64)
- **Ticket** — unique `ticketNumber` (TKT-XXXX format), enums for type/status/priority, image attachments as base64, inline image placeholders `{{img:N}}`
- **TicketResponse** — belongs to ticket, optional user, `isInternal` flag for admin-only notes
- **TicketActivity** — audit log per ticket (created, assigned, status_changed, priority_changed, mentioned)

### Frontend Libraries
- `src/lib/api.ts` — Fetch wrapper with JWT auth headers
- `src/lib/paste-utils.ts` — Rich clipboard paste handler (images, Gmail HTML content)
- `src/lib/ticket-utils.ts` — Display helpers, date formatting
- `src/hooks/useAuth.ts` — Convenience auth hook
- `src/hooks/useRequireAuth.ts` — Route guard hook

### UI
Dark glassmorphism design with TailwindCSS. Custom component classes (`.btn`, `.card`, `.input`, etc.) in `src/index.css` via `@layer components`. Crane Network branding with gold/brown palette. Uses lucide-react icons, framer-motion animations, recharts for charts, canvas-confetti for effects, react-hot-toast for notifications.

### Pages (10 routes)
- `/` — HomePage (hero, stats, ticket table)
- `/login` — LoginPage
- `/register` — RegisterPage
- `/submit` — SubmitPage (ticket creation)
- `/track` — TrackPage (ticket lookup by number)
- `/tickets/:id` — TicketDetailPage (email-gated)
- `/dashboard` — DashboardPage (user's tickets)
- `/admin` — AdminDashboardPage (all tickets, charts)
- `/admin/tickets/:id` — AdminTicketDetailPage (full management)
- `/search` — SearchPage (knowledge base search)

### Component Structure
- `src/components/layout/` — Navbar, Footer, PageLayout, AnimatedPage
- `src/components/ui/` — Badges, StatCard, SearchInput, ConfirmDialog, ImageUpload, ImageGallery, EmptyState, NotificationPanel
- `src/components/tickets/` — TicketForm, TicketTable, TicketCard, TicketList, TicketDetails, ResponseForm, ResponseTimeline
- `src/components/charts/` — StatusPieChart, TicketsOverTimeChart

### Deployment
Two Docker containers: nginx (frontend) and Node.js (API). nginx proxies `/api/` to the backend. SQLite database persisted via Docker volume `db-data`. Config files: `Dockerfile`, `server/Dockerfile`, `docker-compose.yml`, `nginx.conf`.
