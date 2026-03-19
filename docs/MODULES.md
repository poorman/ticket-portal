# Modules

Breakdown of every module in the application, organized by directory.

---

## Types (`src/types/index.ts`)

Single file defining all shared TypeScript interfaces and union types.

| Export              | Kind      | Description                                      |
|---------------------|-----------|--------------------------------------------------|
| `UserRole`          | Type      | `'user' \| 'admin'`                              |
| `TicketType`        | Type      | `'support' \| 'bug' \| 'feature_request' \| 'general'` |
| `TicketStatus`      | Type      | `'open' \| 'in_progress' \| 'waiting_response' \| 'resolved' \| 'closed'` |
| `TicketPriority`    | Type      | `'low' \| 'medium' \| 'high'`                    |
| `User`              | Interface | User record with id, email, password, name, role |
| `Ticket`            | Interface | Full ticket with metadata, submitter info, images |
| `TicketResponse`    | Interface | Response/comment on a ticket                     |
| `CreateTicketInput` | Interface | Input shape for creating a ticket                |
| `CreateResponseInput` | Interface | Input shape for adding a response              |

---

## Stores (`src/store/`)

### `authStore.ts`
Zustand store persisted to `localStorage` key `ticket-portal-auth`.

| Member         | Type     | Description                                         |
|----------------|----------|-----------------------------------------------------|
| `users`        | State    | Array of all registered `User` records              |
| `currentUser`  | State    | Currently logged-in user, or `null`                 |
| `nextUserId`   | State    | Auto-increment counter for user IDs                 |
| `login()`      | Action   | Find user by email, verify password, set session    |
| `logout()`     | Action   | Clear `currentUser`                                 |
| `register()`   | Action   | Create new user, return `{ user }` or `{ error }`   |
| `isAdmin()`    | Getter   | Returns `true` if current user has admin role       |
| `getUserById()`| Getter   | Look up user by numeric ID                          |

Seeds a default admin user (`admin@widesurf.com` / `admin123`) in initial state.

### `ticketStore.ts`
Zustand store persisted to `localStorage` key `ticket-portal-tickets`.

| Member                   | Type   | Description                                           |
|--------------------------|--------|-------------------------------------------------------|
| `tickets`                | State  | Array of all `Ticket` records                         |
| `responses`              | State  | Array of all `TicketResponse` records                 |
| `nextTicketId`           | State  | Auto-increment for ticket IDs                         |
| `nextTicketNumber`       | State  | Counter for `TKT-XXXX` generation (starts at 1001)   |
| `nextResponseId`         | State  | Auto-increment for response IDs                       |
| `createTicket()`         | Action | Create ticket, assign number, prepend to list         |
| `getTicketById()`        | Getter | Look up ticket by numeric ID                          |
| `getTicketByNumber()`    | Getter | Look up ticket by `TKT-XXXX` string (case-insensitive) |
| `getTicketsForUser()`    | Getter | Filter tickets by userId OR submitterEmail match      |
| `updateTicket()`         | Action | Patch status/priority, auto-set `closedAt` on close  |
| `deleteTicket()`         | Action | Remove ticket and cascade-delete its responses        |
| `searchTickets()`        | Getter | Full-text search across number, subject, description, email |
| `addResponse()`          | Action | Append response, update ticket's `updatedAt`          |
| `getResponsesForTicket()`| Getter | Filter responses by ticketId, optionally include internal |

### `uiStore.ts`
Zustand store, **not persisted** (ephemeral UI state).

| Member             | Type   | Description                                      |
|--------------------|--------|--------------------------------------------------|
| `searchQuery`      | State  | Current search input value                       |
| `sortField`        | State  | Column key to sort by (default: `createdAt`)     |
| `sortOrder`        | State  | `'asc'` or `'desc'` (default: `'desc'`)         |
| `setSearchQuery()` | Action | Update search query                              |
| `setSortField()`   | Action | Set sort field, toggle order if same field       |
| `toggleSortOrder()`| Action | Flip between asc/desc                            |

---

## Libraries (`src/lib/`)

### `auth-utils.ts`
| Function           | Description                              |
|--------------------|------------------------------------------|
| `hashPassword()`   | Encodes password with `btoa()` (demo)    |
| `verifyPassword()` | Compares password against stored hash    |

### `ticket-utils.ts`
| Function               | Description                                      |
|------------------------|--------------------------------------------------|
| `getTicketTypeDisplay()` | Maps type enum to human label (e.g. `bug` -> `Bug Report`) |
| `getStatusDisplay()`    | Maps status enum to human label                  |
| `getPriorityDisplay()`  | Maps priority enum to human label                |
| `formatDate()`          | Formats ISO string to `"Mar 5, 2026, 02:30 PM"` |
| `formatDateShort()`     | Formats ISO string to `"Mar 5, 2026"`            |

---

## Hooks (`src/hooks/`)

### `useAuth.ts`
Convenience hook that reads from `authStore` and returns `{ user, isLoggedIn, isAdmin, login, logout, register }`.

### `useRequireAuth.ts`
Route guard hook. Accepts optional `adminOnly` boolean. Redirects to `/login` if not authenticated, or to `/dashboard` if authenticated but not admin when `adminOnly=true`. Returns the current user.

---

## Layout Components (`src/components/layout/`)

| Component       | Description                                                   |
|-----------------|---------------------------------------------------------------|
| `Navbar`        | Sticky black top bar with Crane Network logo, nav links, auth state. Responsive with mobile hamburger menu. |
| `Footer`        | Site footer with copyright and quick links. Shows "Create Account" link for unauthenticated users. |
| `PageLayout`    | Wraps `<Outlet />` between Navbar and Footer. Used as the root route element. |
| `AnimatedPage`  | Framer Motion wrapper applying fade + slide-up on mount/unmount. Every page is wrapped in this. |

---

## UI Components (`src/components/ui/`)

| Component       | Props                          | Description                                       |
|-----------------|--------------------------------|---------------------------------------------------|
| `StatusBadge`   | `status: TicketStatus`         | Color-coded pill showing ticket status             |
| `PriorityBadge` | `priority: TicketPriority`     | Color-coded pill showing ticket priority           |
| `TypeBadge`     | `type: TicketType`             | Purple pill showing ticket type                    |
| `StatCard`      | `label, value, icon, color?`   | Dashboard metric card with large number and icon   |
| `SearchInput`   | `value, onChange, placeholder?` | Text input with search icon and clear button       |
| `ConfirmDialog` | `open, title, message, onConfirm, onCancel` | Modal overlay for destructive action confirmation |
| `ImageUpload`   | `images, onChange, maxImages?`  | File picker that converts images to base64 with preview thumbnails |
| `ImageGallery`  | `images: string[]`             | Thumbnail grid with click-to-enlarge lightbox      |
| `EmptyState`    | `icon?, title, description?, action?` | Centered placeholder for empty lists          |

---

## Ticket Components (`src/components/tickets/`)

| Component          | Description                                                      |
|--------------------|------------------------------------------------------------------|
| `TicketForm`       | Full ticket creation form (type, subject, description, contact info, priority, images). Fires canvas-confetti on success. |
| `TicketTable`      | Sortable HTML table with column headers linked to `uiStore`. Used on HomePage and AdminDashboardPage. |
| `TicketCard`       | Compact card showing ticket number, status, priority, subject, date, response count. Links to detail page. |
| `TicketList`       | Maps an array of tickets to animated `TicketCard` components. Shows `EmptyState` when empty. |
| `TicketDetails`    | Full ticket view: header with badges, description, contact info, attachments gallery, response timeline. |
| `ResponseForm`     | Textarea + image upload for adding responses. Admin users see an "Internal note" checkbox. |
| `ResponseTimeline` | Chronological list of responses as styled message bubbles. Internal notes highlighted in amber. |

---

## Chart Components (`src/components/charts/`)

| Component              | Description                                                  |
|------------------------|--------------------------------------------------------------|
| `StatusPieChart`       | Recharts donut chart showing ticket count per status. Colors match `StatusBadge`. |
| `TicketsOverTimeChart` | Recharts line chart showing daily ticket creation count over the last 30 days. Gold-colored line. |

---

## Pages (`src/pages/`) — 11 routes

| Page                     | Route                  | Auth     | Description                                           |
|--------------------------|------------------------|----------|-------------------------------------------------------|
| `HomePage`               | `/`                    | Public   | Hero section, stat cards, searchable sortable ticket table |
| `LoginPage`              | `/login`               | Public   | Email/password sign-in form                           |
| `RegisterPage`           | `/register`            | Public   | Registration form (name, email, password)             |
| `SubmitPage`             | `/submit`              | Public   | Ticket creation via `TicketForm`                      |
| `TrackPage`              | `/track`               | Public   | Ticket lookup by number + email verification          |
| `TicketDetailPage`       | `/tickets/:id`         | Email verify | Ticket details with email gate or session access   |
| `DashboardPage`          | `/dashboard`           | User     | Personal ticket overview with stats                   |
| `AdminDashboardPage`     | `/admin`               | Admin    | All tickets overview with charts and priority alerts  |
| `AdminTicketDetailPage`  | `/admin/tickets/:id`   | Admin    | Full ticket management (status, priority, delete, internal notes) |
| `SearchPage`             | `/search`              | Public   | Knowledge base search with filtered results           |
| `NotFoundPage`           | `*`                    | Public   | 404 page                                             |
