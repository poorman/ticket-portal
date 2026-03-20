# Modules

Breakdown of every module in the application, organized by directory.

---

## Types (`src/types/index.ts`)

Single file defining all shared TypeScript interfaces and union types.

| Export              | Kind      | Description                                      |
|---------------------|-----------|--------------------------------------------------|
| `UserRole`          | Type      | `'user' \| 'admin'`                              |
| `TicketType`        | Type      | `'support' \| 'bug' \| 'feature_request' \| 'general'` |
| `TicketStatus`      | Type      | `'open' \| 'in_progress' \| 'waiting_response' \| 'resolved'` |
| `TicketPriority`    | Type      | `'low' \| 'medium' \| 'high'`                    |
| `User`              | Interface | User record with id, username, email, password, name, role |
| `Ticket`            | Interface | Full ticket with metadata, submitter info, assignees, images |
| `TicketResponse`    | Interface | Response/comment on a ticket                     |
| `CreateTicketInput` | Interface | Input shape for creating a ticket                |
| `CreateResponseInput` | Interface | Input shape for adding a response              |

---

## Backend (`server/`)

### `index.js`
Express application entry point. Configures CORS, JSON body parsing (50MB limit), mounts all route modules, starts HTTP server.

### `db.js`
SQLite database connection and schema management.

| Export           | Description                                      |
|------------------|--------------------------------------------------|
| `db`             | better-sqlite3 database instance                 |
| `toTicket()`     | Convert DB row (snake_case) to Ticket object     |
| `toResponse()`   | Convert DB row to TicketResponse object           |
| `toUser()`       | Convert DB row to User object (optional password) |
| `toNotification()` | Convert DB row to Notification object           |

Seeds default admin user on first run.

### `auth.js`
JWT authentication middleware.

| Export           | Description                                      |
|------------------|--------------------------------------------------|
| `signToken()`    | Create JWT for a user ID                         |
| `optionalAuth`   | Middleware: sets `req.user` if valid token present |
| `requireAuth`    | Middleware: returns 401 if not authenticated      |
| `requireAdmin`   | Middleware: returns 403 if not admin              |

### Routes

| File                    | Base Path           | Description                              |
|-------------------------|---------------------|------------------------------------------|
| `routes/auth.js`        | `/api/auth`         | Login, register, profile management      |
| `routes/users.js`       | `/api/users`        | Admin user CRUD, suspend toggle          |
| `routes/tickets.js`     | `/api/tickets`      | Ticket CRUD, responses, search, resolve  |
| `routes/notifications.js` | `/api/notifications` | Notification list, mark read, clear    |

---

## Frontend Stores (`src/store/`)

### `authStore.ts`
API-backed Zustand store for authentication.

| Member            | Type     | Description                                         |
|-------------------|----------|-----------------------------------------------------|
| `users`           | State    | Cached array of all `User` records                  |
| `currentUser`     | State    | Currently logged-in user, or `null`                 |
| `initialized`     | State    | Whether auth token has been validated                |
| `initialize()`    | Action   | Validate stored JWT, load user, fetch users list    |
| `login()`         | Action   | Async POST to `/api/auth/login`, store JWT          |
| `logout()`        | Action   | Clear JWT and user state                            |
| `register()`      | Action   | Async POST to `/api/auth/register`                  |
| `fetchUsers()`    | Action   | Load all users from API (for admin, @mentions)      |
| `isAdmin()`       | Getter   | Returns `true` if current user has admin role       |
| `getUserById()`   | Getter   | Look up user by ID from cached list                 |

### `ticketStore.ts`
API-backed Zustand store for tickets and responses.

| Member                   | Type   | Description                                           |
|--------------------------|--------|-------------------------------------------------------|
| `tickets`                | State  | Array of `Ticket` records                             |
| `responses`              | State  | Array of `TicketResponse` records (per-ticket loaded) |
| `responseCounts`         | State  | Map of ticket ID to response count                    |
| `loading`                | State  | Whether tickets are being fetched                     |
| `fetchTickets()`         | Action | Load all tickets from API                             |
| `fetchTicketDetail()`    | Action | Load single ticket with its responses                 |
| `createTicket()`         | Action | Async POST to create ticket                           |
| `updateTicket()`         | Action | Async PUT to update status/priority (admin)           |
| `resolveTicket()`        | Action | Async POST to resolve ticket                          |
| `deleteTicket()`         | Action | Async DELETE ticket (admin)                           |
| `addResponse()`          | Action | Async POST to add response                            |
| `deleteResponse()`       | Action | Async DELETE response (admin)                         |
| `deepSearch()`           | Action | Async search via API                                  |
| `getTicketByNumber()`    | Action | Async lookup by TKT-XXXX                             |

### `notificationStore.ts`
API-backed Zustand store for notifications.

| Member               | Type   | Description                                      |
|----------------------|--------|--------------------------------------------------|
| `notifications`      | State  | Array of `Notification` records                  |
| `fetchNotifications()` | Action | Load notifications from API                    |
| `markRead()`         | Action | Mark single notification as read                 |
| `markAllRead()`      | Action | Mark all as read                                 |
| `clearAll()`         | Action | Delete all notifications                         |
| `unreadCount()`      | Getter | Count of unread notifications                    |

### `readStore.ts`
Client-side only store (localStorage persisted) for tracking read/unread responses.

### `uiStore.ts`
Client-side only store (not persisted) for search/sort/filter UI state.

---

## Frontend Libraries (`src/lib/`)

### `api.ts`
| Export      | Description                                          |
|-------------|------------------------------------------------------|
| `api.get()` | GET request with JWT auth header                     |
| `api.post()` | POST request with JSON body and auth header         |
| `api.put()` | PUT request with JSON body and auth header           |
| `api.delete()` | DELETE request with auth header                   |
| `ApiError`  | Custom error class with HTTP status code             |

### `ticket-utils.ts`
| Function               | Description                                      |
|------------------------|--------------------------------------------------|
| `getTicketTypeDisplay()` | Maps type enum to human label                  |
| `getStatusDisplay()`    | Maps status enum to human label                  |
| `getPriorityDisplay()`  | Maps priority enum to human label                |
| `formatDate()`          | Formats ISO string to `"Mar 5, 2026, 02:30 PM"` |
| `formatDateShort()`     | Formats ISO string to `"Mar 5, 2026"`            |

---

## Hooks (`src/hooks/`)

### `useAuth.ts`
Convenience hook returning `{ user, isLoggedIn, isAdmin, login, logout, register }`.

### `useRequireAuth.ts`
Route guard hook. Redirects to `/login` if not authenticated, or to `/dashboard` if not admin.

---

## Components

### Layout (`src/components/layout/`)
| Component       | Description                                                   |
|-----------------|---------------------------------------------------------------|
| `Navbar`        | Sticky black top bar with logo, nav links, auth state, notifications |
| `Footer`        | Site footer with copyright and links                          |
| `PageLayout`    | Wraps `<Outlet />` between Navbar and Footer                  |
| `AnimatedPage`  | Framer Motion fade + slide-up wrapper for pages               |

### UI (`src/components/ui/`)
| Component           | Description                                       |
|---------------------|---------------------------------------------------|
| `StatusBadge`       | Color-coded pill for ticket status                |
| `PriorityBadge`     | Color-coded pill for ticket priority              |
| `TypeBadge`         | Purple pill for ticket type                       |
| `StatCard`          | Dashboard metric card with number and icon        |
| `SearchInput`       | Text input with search icon and clear button      |
| `ConfirmDialog`     | Modal for destructive action confirmation         |
| `ImageUpload`       | File picker with base64 conversion and previews   |
| `ImageGallery`      | Thumbnail grid with lightbox                      |
| `EmptyState`        | Centered placeholder for empty lists              |
| `NotificationPanel` | Dropdown notification list with mark-read actions |

### Tickets (`src/components/tickets/`)
| Component          | Description                                                      |
|--------------------|------------------------------------------------------------------|
| `TicketForm`       | Ticket creation form with type, priority, assignees, CC, images  |
| `TicketTable`      | Sortable paginated table with response counts and NEW badges     |
| `TicketCard`       | Compact card for mobile ticket list view                         |
| `TicketList`       | Maps tickets to animated TicketCard components                   |
| `TicketDetails`    | Full ticket view with header, description, contact, responses    |
| `ResponseForm`     | Response textarea with @mention autocomplete and image upload    |
| `ResponseTimeline` | Chronological responses with user popovers and admin delete      |

### Charts (`src/components/charts/`)
| Component              | Description                                      |
|------------------------|--------------------------------------------------|
| `StatusPieChart`       | Donut chart showing ticket count per status      |
| `TicketsOverTimeChart` | Line chart of daily ticket creation (30 days)    |

---

## Pages (`src/pages/`) — 11 routes

| Page                     | Route                  | Auth     | Description                                           |
|--------------------------|------------------------|----------|-------------------------------------------------------|
| `HomePage`               | `/`                    | Public   | Hero section, stat cards, ticket table                |
| `LoginPage`              | `/login`               | Public   | Email/password sign-in                                |
| `RegisterPage`           | `/register`            | Public   | Registration form                                     |
| `SubmitPage`             | `/submit`              | Public   | Ticket creation via TicketForm                        |
| `TrackPage`              | `/track`               | Public   | Ticket lookup by number + email verification          |
| `TicketDetailPage`       | `/tickets/:id`         | Email    | Ticket details with email gate or session access      |
| `DashboardPage`          | `/dashboard`           | User     | Personal ticket overview with stats                   |
| `AdminDashboardPage`     | `/admin`               | Admin    | All tickets with charts and priority alerts           |
| `AdminTicketDetailPage`  | `/admin/tickets/:id`   | Admin    | Full ticket management                                |
| `SearchPage`             | `/search`              | Public   | Knowledge base search with filtered results           |
| `NotFoundPage`           | `*`                    | Public   | 404 page                                             |
