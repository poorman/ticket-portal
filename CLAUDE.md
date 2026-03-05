# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WideSurf Support Portal — a ticket management system for support.widesurf.com. Built with Next.js 16 (App Router), React 19, Prisma ORM, PostgreSQL, and NextAuth v5 (credentials provider with JWT strategy).

## Commands

- **Dev server**: `npm run dev` (uses custom `scripts/dev-server.js` with auto port detection from 3007)
- **Build**: `npm run build` (runs `prisma generate && next build`)
- **Lint**: `npm run lint` (ESLint with next/core-web-vitals + typescript configs)
- **DB migrate**: `npm run prisma:migrate` or `npx prisma migrate dev`
- **DB generate**: `npm run prisma:generate`
- **DB seed**: `npm run prisma:seed` (creates admin user from env vars)
- **DB reset**: `npx prisma migrate reset` (destructive)

## Architecture

### Auth Flow
NextAuth v5 with credentials provider in `lib/auth.ts`. JWT strategy stores `id` and `role` in token. Middleware (`middleware.ts`) protects `/dashboard/*` (requires auth) and `/admin/*` (requires admin role). Custom sign-in page at `/login`.

### Database (Prisma)
Schema in `prisma/schema.prisma`. Three models:
- **User**: email/password auth, `UserRole` enum (user/admin)
- **Ticket**: unique `ticketNumber` (TKT-XXXX format), enums for type/status/priority, optional `userId` link, image attachments
- **TicketResponse**: belongs to ticket, optional user, `isInternal` flag for admin-only notes, image attachments

### API Routes (`app/api/`)
- `auth/[...nextauth]/` — NextAuth handler
- `auth/register/` — user registration
- `tickets/route.ts` — ticket list/create
- `tickets/[id]/` — single ticket operations
- `upload/` — file upload handling

### Key Libraries
- `lib/prisma.ts` — Prisma client singleton
- `lib/auth.ts` — NextAuth config (exports `handlers`, `signIn`, `signOut`, `auth`)
- `lib/email.ts` — Nodemailer email service with HTML templates
- `lib/ticket-utils.ts` — ticket number generation and helpers

### Path Alias
`@/*` maps to project root (configured in `tsconfig.json`).

### UI
Neumorphic design system using CSS classes: `.neumorphic`, `.neumorphic-inset`, `.neumorphic-pressed`, `.neumorphic-hover`. Base color `#e0e5ec`. Uses Bulma CSS framework and react-hot-toast for notifications.

### Deployment
Standalone Next.js output (`next.config.ts` has `output: 'standalone'`). Docker support via `Dockerfile.prod` and `docker-compose.prod.yml`. Traefik reverse proxy config in `traefik-config.yml`. Deploy scripts: `DEPLOY.sh`, `deploy-native.sh`, `START.sh`.
