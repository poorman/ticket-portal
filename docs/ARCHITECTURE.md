# Architecture

## Overview

Crane Network Support Portal is a full-stack ticket management application with a React SPA frontend and an Express.js + SQLite backend API. Data is persisted in a SQLite database stored on a Docker volume, enabling shared state across devices and browsers.

## Tech Stack

| Layer       | Technology               |
|-------------|--------------------------|
| Frontend    | React 18 + TypeScript    |
| Build       | Vite 6                   |
| Routing     | React Router v6          |
| Styling     | TailwindCSS 3.4          |
| State       | Zustand                  |
| Charts      | Recharts                 |
| Animations  | Framer Motion            |
| Icons       | Lucide React             |
| Effects     | canvas-confetti          |
| Toasts      | react-hot-toast          |
| Backend     | Express.js (Node.js)     |
| Database    | SQLite (better-sqlite3)  |
| Auth        | JWT + bcrypt             |
| Deploy      | Docker Compose + nginx   |

## High-Level Diagram

```
Browser (React SPA)
  |
  | HTTP /api/*
  v
nginx (port 3014)
  |
  |-- Static files (/, /assets/*)  --> dist/ (Vite build)
  |-- API proxy (/api/*)           --> Express API (port 3001)
                                         |
                                         v
                                    SQLite (portal.db)
                                    Docker volume: db-data
```

## Layers

### 1. Frontend Entry
- `index.html` — Vite entry point
- `src/main.tsx` — Renders `<App />`
- `src/App.tsx` — Router, auth initialization, data fetching

### 2. State Layer (`src/store/`)
Zustand stores backed by API calls:
- `authStore` — User auth via JWT. Async login/register/logout. Caches user list.
- `ticketStore` — Tickets and responses via REST API. Async CRUD.
- `notificationStore` — Notifications via API.
- `readStore` — Per-ticket read tracking. Client-side localStorage only.
- `uiStore` — Ephemeral search/sort/filter state. Client-side only.

### 3. API Client (`src/lib/api.ts`)
Fetch wrapper that attaches JWT Bearer token from `localStorage('auth-token')` to all requests. Handles JSON serialization and error responses.

### 4. Backend API (`server/`)
Express.js with CommonJS modules:
- `index.js` — App setup, middleware, route mounting
- `db.js` — SQLite connection, schema creation, seed data, row converters
- `auth.js` — JWT sign/verify, auth middleware (optionalAuth, requireAuth, requireAdmin)
- `routes/auth.js` — Login, register, profile
- `routes/users.js` — Admin user CRUD
- `routes/tickets.js` — Ticket CRUD, responses, search
- `routes/notifications.js` — Notification CRUD

### 5. Database (SQLite)
Tables: `users`, `tickets`, `responses`, `notifications`. Array fields (assignedTo, ccEmails, images) stored as JSON text columns. Database file persisted via Docker volume.

## Authentication Flow

1. User submits email/password to `POST /api/auth/login`
2. Server validates credentials with bcrypt, returns JWT token + user object
3. Frontend stores token in `localStorage('auth-token')`
4. All subsequent API requests include `Authorization: Bearer <token>` header
5. Server middleware decodes JWT to identify the user
6. On app reload, `authStore.initialize()` calls `GET /api/auth/me` to validate the stored token

## Deployment Model

Docker Compose runs two services:
- **frontend** — nginx serving the Vite build, proxying `/api/` to the API container
- **api** — Node.js running Express, SQLite database stored in a named volume (`db-data`)

Port 3014 is exposed to the host. The API container is not directly accessible from outside Docker.
