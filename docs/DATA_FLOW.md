# Data Flow

How data moves through the application, from user interaction to persistence.

---

## Storage Architecture

```
Browser localStorage
  |
  +-- "ticket-portal-auth"     (JSON: users[], currentUser, nextUserId)
  |
  +-- "ticket-portal-tickets"  (JSON: tickets[], responses[], counters)
```

Zustand's `persist` middleware automatically serializes store state to localStorage on every mutation and rehydrates on page load.

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
ticketStore.createTicket(data)
  |
  +-- Generate ticketNumber: "TKT-{nextTicketNumber}"
  +-- Increment nextTicketId, nextTicketNumber
  +-- Prepend ticket to tickets[]
  +-- Persist to localStorage
  |
  v
canvas-confetti fires
  |
  v
Toast: "Ticket TKT-XXXX created!"
Toast: "Email notification would be sent to {email}"
  |
  v
Navigate to home page (after 2s delay)
```

### 2. User Authentication

```
Login:
  User enters email + password on LoginPage
    |
    v
  authStore.login(email, password)
    |
    +-- Find user in users[] by email (case-insensitive)
    +-- Verify password via verifyPassword(input, stored)
    +-- Set currentUser = matched user
    +-- Persist to localStorage
    |
    v
  Navigate to /admin (if admin) or /dashboard (if user)

Register:
  User fills RegisterPage form
    |
    v
  authStore.register(name, email, password)
    |
    +-- Check for duplicate email
    +-- Hash password with hashPassword()
    +-- Append new User to users[]
    +-- Increment nextUserId
    +-- Persist to localStorage
    |
    v
  Navigate to /login

Logout:
  authStore.logout()
    |
    +-- Set currentUser = null
    +-- Persist to localStorage
    |
    v
  Navigate to /
```

### 3. Ticket Tracking (Public)

```
User enters ticket number + email on TrackPage
  |
  v
ticketStore.getTicketByNumber(number)
  |
  v
Compare ticket.submitterEmail with entered email (case-insensitive)
  |
  +-- Match: Show TicketDetails + ResponseForm
  +-- No match: Toast error "No ticket found"
  |
  v
Email stored in localStorage key "track-email" for future visits
```

### 4. Adding a Response

```
User/Admin fills ResponseForm
  |
  v
ticketStore.addResponse({
  ticketId, userId?, userName, userRole,
  message, images[], isInternal
})
  |
  +-- Create TicketResponse with nextResponseId
  +-- Append to responses[]
  +-- Update ticket.updatedAt
  +-- Persist to localStorage
  |
  v
Toast: "Response added"
Toast: "Email notification would be sent" (if not internal)
```

### 5. Admin Ticket Update

```
Admin changes status/priority dropdowns on AdminTicketDetailPage
  |
  v
ticketStore.updateTicket(id, { status?, priority? })
  |
  +-- Patch ticket fields
  +-- If status is "closed" or "resolved": set closedAt = now
  +-- If status changes to other value: clear closedAt
  +-- Set updatedAt = now
  +-- Persist to localStorage
  |
  v
Toast: "Ticket updated"
```

### 6. Ticket Deletion

```
Admin clicks Delete on AdminTicketDetailPage
  |
  v
ConfirmDialog shown
  |
  v (confirmed)
ticketStore.deleteTicket(id)
  |
  +-- Remove ticket from tickets[]
  +-- Remove all responses where ticketId matches (cascade)
  +-- Persist to localStorage
  |
  v
Toast: "Ticket deleted"
Navigate to /admin
```

---

## Search and Sort Flow

```
User types in SearchInput (HomePage or AdminDashboardPage)
  |
  v
uiStore.setSearchQuery(query)
  |
  v
Page component uses useMemo:
  query ? ticketStore.searchTickets(query) : ticketStore.tickets
  |
  +-- searchTickets filters on: ticketNumber, subject, description, submitterEmail
  |
  v
Filtered tickets passed to TicketTable

User clicks column header in TicketTable
  |
  v
uiStore.setSortField(field)
  |
  +-- If same field: toggle sortOrder (asc <-> desc)
  +-- If different field: set new field, reset to desc
  |
  v
TicketTable sorts in-memory using String.localeCompare with numeric option
```

---

## Route Protection Flow

```
Page component calls useRequireAuth(adminOnly?)
  |
  v
Check authStore.currentUser
  |
  +-- null: navigate("/login", replace)
  +-- user role, adminOnly=true: navigate("/dashboard", replace)
  +-- authorized: return currentUser, render page
```

For public ticket detail pages (`/tickets/:id`), access is gated by an inline email verification form rather than `useRequireAuth`.

---

## Image Data Flow

```
User selects files via ImageUpload component
  |
  v
FileReader.readAsDataURL() converts each file to base64 string
  |
  +-- Validation: must be image/*, max 5MB, max 5 images
  |
  v
Base64 strings stored in component state as string[]
  |
  v
On form submit: base64 strings saved into ticket.images or response.images
  |
  v
Persisted to localStorage as part of the ticket/response JSON

Display:
  ImageGallery renders <img src={base64DataUrl} />
  Click opens lightbox overlay (Framer Motion animated)
```

---

## Persistence Lifecycle

```
App loads
  |
  v
Zustand persist middleware reads localStorage keys
  |
  +-- "ticket-portal-auth" exists?
  |     Yes: rehydrate authStore (users, currentUser, nextUserId)
  |     No:  use initial state (default admin user seeded)
  |
  +-- "ticket-portal-tickets" exists?
  |     Yes: rehydrate ticketStore (tickets, responses, counters)
  |     No:  use initial state (empty arrays, counters at 1/1001/1)
  |
  v
Any store mutation triggers:
  1. React re-render (subscribed components)
  2. Serialize full store state to localStorage
```
