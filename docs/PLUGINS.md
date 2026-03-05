# Plugins & Extensibility

The application is designed with clear extension points through its modular store and component architecture.

---

## Extension Points

### 1. Zustand Stores (Primary Extension Point)

New domain logic is added by creating a new Zustand store in `src/store/` or extending an existing one.

**Adding a new store:**

```typescript
// src/store/notificationStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Notification {
  id: number;
  message: string;
  read: boolean;
  createdAt: string;
}

interface NotificationState {
  notifications: Notification[];
  addNotification: (message: string) => void;
  markRead: (id: number) => void;
  unreadCount: () => number;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      addNotification: (message) => { /* ... */ },
      markRead: (id) => { /* ... */ },
      unreadCount: () => get().notifications.filter(n => !n.read).length,
    }),
    { name: 'ticket-portal-notifications' }
  )
);
```

Stores are self-contained and don't require registration in a central provider. Import the hook anywhere to use it.

**Extending an existing store:**

Add new fields and actions directly to the store's interface and implementation. The persist middleware will automatically include new fields in localStorage serialization. Existing persisted data is merged on rehydration (new fields get their default values).

---

### 2. Component System

Components follow a layered pattern that makes extension straightforward:

```
src/components/
  ui/        <-- Generic reusable primitives
  tickets/   <-- Domain-specific ticket components
  charts/    <-- Data visualization
  layout/    <-- App shell
```

**Adding a new domain module** (e.g., Knowledge Base):

1. Create `src/components/kb/` directory
2. Build components following existing patterns (use `card` CSS class, `AnimatedPage` wrapper, Lucide icons)
3. Create a page in `src/pages/KBPage.tsx`
4. Add a route in `src/App.tsx`
5. Optionally add a nav link in `Navbar.tsx`

---

### 3. Badge System

Status, priority, and type badges follow a consistent pattern. Adding a new badge type:

```typescript
// src/components/ui/SeverityBadge.tsx
const styles: Record<string, string> = {
  critical: 'bg-red-100 text-red-700',
  major: 'bg-orange-100 text-orange-700',
  minor: 'bg-yellow-100 text-yellow-700',
};

export default function SeverityBadge({ severity }: { severity: string }) {
  return <span className={`badge ${styles[severity] || 'bg-gray-100 text-gray-600'}`}>{severity}</span>;
}
```

---

### 4. Chart System

Charts are isolated Recharts wrappers in `src/components/charts/`. Adding a new chart:

1. Create a new file in `src/components/charts/`
2. Accept a `tickets: Ticket[]` prop (or whatever data source)
3. Process data into the shape Recharts expects
4. Use the existing color tokens from `tailwind.config.js` for consistency
5. Drop the component into any page

---

### 5. Route Guards

The `useRequireAuth` hook supports two access levels (`user` and `admin`). To add more granular roles:

1. Add new values to the `UserRole` type union in `src/types/index.ts`
2. Update `useRequireAuth` to accept a `requiredRole` parameter instead of a boolean
3. Update `authStore.isAdmin()` or add new role-check getters

---

### 6. Tailwind Theme

Brand colors and design tokens are centralized in `tailwind.config.js`. To add new semantic colors:

```javascript
// tailwind.config.js
extend: {
  colors: {
    crane: { /* existing */ },
    status: { /* existing */ },
    // Add new:
    severity: {
      critical: '#dc2626',
      major: '#ea580c',
      minor: '#ca8a04',
    },
  },
}
```

All components can then use `bg-severity-critical`, `text-severity-major`, etc.

---

### 7. Custom CSS Component Classes

Reusable class groups are defined in `src/index.css` under `@layer components`. Add new component classes here to avoid repeating long Tailwind strings:

```css
@layer components {
  .card-compact {
    @apply bg-white rounded-lg shadow-sm border border-gray-100 p-3 text-sm;
  }
  .btn-ghost {
    @apply text-gray-500 hover:text-gray-700 hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors;
  }
}
```

---

## Integration Patterns

### Adding a Backend API

To migrate from localStorage to a real backend without rewriting components:

1. Create an API client module (e.g., `src/lib/api.ts`) with fetch wrappers
2. Replace Zustand store actions with async API calls
3. Keep the same store interface -- components don't need to change
4. Remove the `persist` middleware since the backend is the source of truth

Example migration of `createTicket`:

```typescript
// Before (localStorage):
createTicket: (data) => {
  const ticket = { id: get().nextTicketId, ... };
  set((state) => ({ tickets: [ticket, ...state.tickets] }));
  return ticket;
}

// After (API):
createTicket: async (data) => {
  const ticket = await api.post('/tickets', data);
  set((state) => ({ tickets: [ticket, ...state.tickets] }));
  return ticket;
}
```

### Adding WebSocket Support

Real-time updates can be layered in by:

1. Create a `src/lib/socket.ts` module that connects to a WebSocket server
2. On incoming messages, call store actions directly: `useTicketStore.getState().updateTicket(...)`
3. Zustand stores are callable outside React, so no provider wiring is needed
