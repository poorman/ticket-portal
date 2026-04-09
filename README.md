# Ticket Portal

A support ticket management system with multi-portal support. Built with React, Express.js, and SQLite.

## Features

- **Multi-Portal Support** — Switch between Crane Network and Car Network portals, each with their own tickets and branding
- **Ticket Management** — Create, track, assign, and resolve support tickets
- **Role-Based Access** — Admin and user roles with different permissions
- **Real-Time Notifications** — In-app notification system with @mentions
- **Knowledge Base Search** — Deep search across tickets and responses
- **Responsive Design** — Optimized mobile layout with compact ticket cards
- **Dark Theme** — Glassmorphism UI with gold/brown accent palette

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite 6, TailwindCSS, Zustand, Framer Motion
- **Backend:** Express.js, better-sqlite3, JWT authentication
- **Deployment:** Docker (nginx + Node.js), SQLite volume persistence

## Quick Start

### Development

```bash
# Frontend (port 5173)
npm install
npm run dev

# Backend (port 3001)
cd server
node --watch index.js
```

### Docker

```bash
docker compose up -d --build
```

The app runs on port **3014** (frontend) with the API proxied through nginx.

## Default Accounts

| Role  | Email               | Password   |
|-------|---------------------|------------|
| Admin | admin@widesurf.com  | admin123   |

## Project Structure

```
src/
  components/    # React components (layout, ui, tickets, charts)
  pages/         # Route pages (Home, Dashboard, Admin, etc.)
  store/         # Zustand stores (auth, tickets, portal, ui)
  types/         # TypeScript type definitions
  lib/           # Utilities (API client, helpers)
server/
  index.js       # Express entry point
  db.js          # SQLite schema, migrations, seed data
  routes/        # API route handlers
```
