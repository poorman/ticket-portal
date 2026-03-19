# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Crane Network Support Portal — a ticket management system built as a client-side SPA. React 18, Vite 6, TypeScript, TailwindCSS 3.4, Zustand for state management with localStorage persistence. No backend or database — all data lives in the browser.

## Commands

- **Dev server**: `npm run dev` (Vite dev server, default port 5173)
- **Build**: `npm run build` (runs `tsc -b && vite build`, outputs to `dist/`)
- **Preview**: `npm run preview` (serve production build locally)
- **Lint**: `npm run lint` (ESLint)

## Architecture

### Auth
Client-side auth via Zustand `authStore`. Users stored in localStorage. Passwords use base64 encoding (demo only). Default admin: `admin@widesurf.com` / `admin123`. Route protection via `useRequireAuth` hook.

### State Management (Zustand)
Three stores in `src/store/`:
- **authStore** — users, session, login/register/logout. Persisted to `ticket-portal-auth`.
- **ticketStore** — tickets, responses, full CRUD. Persisted to `ticket-portal-tickets`.
- **uiStore** — search/sort/filter state. Not persisted.

### Data Model
Defined in `src/types/index.ts`:
- **User** — email/password auth, `UserRole` enum (user/admin)
- **Ticket** — unique `ticketNumber` (TKT-XXXX format), enums for type/status/priority, image attachments as base64
- **TicketResponse** — belongs to ticket, optional user, `isInternal` flag for admin-only notes

### Key Libraries
- `src/lib/auth-utils.ts` — Password encoding helpers
- `src/lib/ticket-utils.ts` — Display helpers, date formatting
- `src/hooks/useAuth.ts` — Convenience auth hook
- `src/hooks/useRequireAuth.ts` — Route guard hook

### Path Alias
`@/*` maps to `./src/*` (configured in `tsconfig.json` and `vite.config.ts`).

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
- `src/components/ui/` — Badges, StatCard, SearchInput, ConfirmDialog, ImageUpload, ImageGallery, EmptyState
- `src/components/tickets/` — TicketForm, TicketTable, TicketCard, TicketList, TicketDetails, ResponseForm, ResponseTimeline
- `src/components/charts/` — StatusPieChart, TicketsOverTimeChart

### Deployment
Static SPA served by nginx in Docker. Multi-stage build: Node (build) → nginx (serve). Config files: `Dockerfile`, `docker-compose.yml`, `nginx.conf`, `.dockerignore`. SPA fallback via `try_files $uri /index.html`.
