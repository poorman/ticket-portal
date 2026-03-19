# Architecture

## Overview

Crane Network Support Portal is a client-side single-page application (SPA) for ticket management. It runs entirely in the browser with no backend server -- all data is persisted to `localStorage` via Zustand stores. Features a dark glassmorphism UI with Crane Network gold/brown branding.

## Tech Stack

| Layer       | Technology               |
|-------------|--------------------------|
| Framework   | React 18 + TypeScript    |
| Build       | Vite 6                   |
| Routing     | React Router v6          |
| Styling     | TailwindCSS 3.4          |
| State       | Zustand (persisted)      |
| Charts      | Recharts                 |
| Animations  | Framer Motion            |
| Icons       | Lucide React             |
| Effects     | canvas-confetti          |
| Toasts      | react-hot-toast          |
| Deploy      | Docker + nginx           |

## High-Level Diagram

```
index.html
  |
  main.tsx
  |
  App.tsx (BrowserRouter + Toaster + AnimatePresence)
  |
  PageLayout (Navbar + Outlet + Footer)
  |
  +-- Pages (11 route-level components)
       |
       +-- Components (layout, ui, tickets, charts)
       |
       +-- Zustand Stores (authStore, ticketStore, uiStore)
            |
            localStorage  <-- persist middleware
```

## Layers

### 1. Entry Layer
- `index.html` -- Vite entry point, mounts `#root`
- `src/main.tsx` -- Renders `<App />` inside `StrictMode`

### 2. Routing Layer
- `src/App.tsx` -- Declares all routes under a shared `PageLayout`
- Route protection is handled by the `useRequireAuth` hook inside page components, which redirects unauthenticated/unauthorized users via `useNavigate`

### 3. Page Layer (`src/pages/`)
Each page is a top-level route component. Pages compose smaller components from `src/components/` and read/write state through Zustand store hooks.

### 4. Component Layer (`src/components/`)
Organized into four directories:
- `layout/` -- Navbar, Footer, PageLayout, AnimatedPage
- `ui/` -- Generic reusable primitives (badges, stat cards, search, dialogs, image handling, empty states)
- `tickets/` -- Domain-specific components (forms, tables, cards, details, responses)
- `charts/` -- Recharts wrappers (pie chart, line chart)

### 5. State Layer (`src/store/`)
Three Zustand stores, two persisted:
- `authStore` -- User records, current session, login/register/logout. Persisted to `ticket-portal-auth`.
- `ticketStore` -- Tickets and responses with full CRUD. Persisted to `ticket-portal-tickets`.
- `uiStore` -- Ephemeral UI state (search query, sort field/order). Not persisted.

### 6. Utility Layer
- `src/types/index.ts` -- Shared TypeScript interfaces and type unions
- `src/lib/auth-utils.ts` -- Password encoding (btoa/atob for demo purposes)
- `src/lib/ticket-utils.ts` -- Display helpers, date formatting
- `src/hooks/` -- `useAuth` (convenience wrapper), `useRequireAuth` (route guard)

## Authentication Model

Authentication is simulated client-side. Zustand's `authStore` holds a `users[]` array and a `currentUser` reference. On first load, a default admin user is seeded. Passwords are base64-encoded (not cryptographically secure -- this is a demo/prototype).

Roles:
- `user` -- Can view own tickets, submit new tickets, add responses
- `admin` -- Full access: view all tickets, update status/priority, add internal notes, delete tickets

## Data Persistence

All application data lives in `localStorage` under two keys:
- `ticket-portal-auth` -- Users and session
- `ticket-portal-tickets` -- Tickets and responses

Clearing localStorage resets the app to its initial state (with the default admin user re-seeded).

## Deployment Model

Production builds are static files served by nginx inside a Docker container. Nginx handles SPA fallback routing (`try_files $uri /index.html`), gzip compression, and static asset caching.
