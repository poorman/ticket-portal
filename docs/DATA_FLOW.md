# Data Flow

How data moves through the application, from user interaction to persistence.

---

## Storage Architecture

```
Browser                              Server
  |                                    |
  +-- localStorage                     +-- SQLite (portal.db)
  |     +-- "auth-token" (JWT)         |     +-- users table
  |     +-- "track-email"              |     +-- tickets table
  |     +-- readStore (per-ticket)     |     +-- responses table
  |                                    |     +-- notifications table
  |                                    |     +-- ticket_activity table
  |                                    |
  +-- Zustand stores (in-memory)       +-- Docker volume: db-data
        +-- authStore                        (persists across rebuilds)
        +-- ticketStore
        +-- notificationStore
        +-- readStore (localStorage)
        +-- uiStore (ephemeral)
```

Zustand stores fetch data from the API on mount and cache in memory. The SQLite database is the single source of truth.

---

## Core Data Flows

### 1. Ticket Creation

```
User fills TicketForm
  |
  v
Form validation (subject >= 5 chars, description >= 10 chars, valid email)
  |
  v
POST /api/tickets (via ticketStore.createTicket)
  |
  v
Server:
  +-- Generate ticketNumber: "TKT-{max+1}"
  +-- Insert into tickets table
  +-- Log activity: "Ticket created", "Assigned to X", "Priority set to Y"
  +-- Create notifications for all admin users
  +-- Return ticket object
  |
  v
Client:
  +-- Prepend ticket to store.tickets[]
  +-- canvas-confetti fires
  +-- Toast: "Ticket TKT-XXXX created!"
  +-- Navigate to home page
```

### 2. User Authentication

```
Login:
  POST /api/auth/login { email, password }
    |
    v
  Server: find user by email/username, bcrypt.compare → JWT token
    |
    v
  Client: store JWT in localStorage("auth-token"), set currentUser
    |
    v
  fetchUsers() to populate user list
    |
    v
  Navigate to /admin (admin) or /dashboard (user)

Register:
  POST /api/auth/register { name, email, password }
    |
    v
  Server: check duplicate, bcrypt.hash, generate username, insert → JWT
    |
    v
  Client: store JWT, set currentUser

App Reload:
  authStore.initialize()
    |
    +-- Read JWT from localStorage
    +-- GET /api/auth/me to validate token
    +-- Set currentUser if valid, clear token if expired
```

### 3. Ticket Tracking (Public)

```
User enters ticket number on TrackPage
  |
  v
GET /api/tickets/by-number/:num
  |
  v
Show ticket details, gate responses behind email verification
  |
  v
Email stored in localStorage("track-email") for future visits
```

### 4. Adding a Response

```
User/Admin fills ResponseForm
  |
  v
POST /api/tickets/:id/responses { message, images, isInternal, ... }
  |
  v
Server:
  +-- Insert response into responses table
  +-- Update ticket.updated_at
  +-- Detect @mentions in message text
  +-- For each @mentioned user:
  |     +-- Create notification: "{responder} mentioned you in TKT-XXXX"
  |     +-- Log activity: "{responder} notified {mentioned user}"
  +-- Notify ticket owner (if not internal, not self)
  |
  v
Client:
  +-- Append response to store.responses[]
  +-- Increment responseCounts
  +-- Toast: "Response added", "{User} notified" for mentions
```

### 5. Ticket Update (Admin or Owner)

```
Admin/Owner edits ticket fields
  |
  v
PUT /api/tickets/:id { status, priority, subject, description, assignedTo, ccEmails, createdAt }
  |
  v
Server:
  +-- Verify admin or owner permission
  +-- Update ticket fields
  +-- Log activity for changes (status, priority, new assignments)
  +-- Notify ticket owner if edited by someone else
  |
  v
Client: update ticket in store.tickets[]
```

### 6. @Mention Flow

```
User types "@" in ResponseForm textarea
  |
  v
Client: autocomplete dropdown shows matching usernames
  |
  v
User selects username → inserted as @username in message
  |
  v
On submit → server detects @mentions → creates notifications + activity
  |
  v
Mentioned user: sees notification in bell icon, can resolve/edit ticket
```

---

## Image Paste Flow

```
User pastes image (Ctrl+V) or rich content from Gmail
  |
  v
handleRichPaste() in paste-utils.ts:
  +-- Screenshot paste: FileReader → base64
  +-- Gmail HTML paste: parse HTML, extract <img> tags, convert to base64 via canvas
  |
  v
Insert {{img:N}} placeholder at cursor position in textarea
Add base64 data to images[] array
  |
  v
On submit: images[] stored in DB, {{img:N}} in text
  |
  v
On display: DescriptionWithEmbeds renders {{img:N}} as inline <img> tags
```

---

## Activity Tracking Flow

```
Ticket events → ticket_activity table
  |
  +-- created: "Ticket created"
  +-- assigned: "Assigned to {username}"
  +-- status_changed: "Status set to {status}"
  +-- priority_changed: "Priority set to {priority}"
  +-- mentioned: "{User1} notified {User2}"
  |
  v
GET /api/tickets/:id returns activities[] alongside ticket + responses
  |
  v
Displayed in right sidebar with colored dots per action type
```

---

## Persistence Lifecycle

```
Docker volume (db-data) → SQLite file (portal.db)
  |
  v
On first run: schema created, admin + 7 default users seeded
  |
  v
On Docker rebuild: volume persists, data survives
  |
  v
API reads/writes SQLite directly (better-sqlite3, synchronous)
  |
  v
Frontend caches in Zustand stores, refetches on navigation
```
