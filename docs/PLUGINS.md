# Plugins & Extensibility

The application is designed with clear extension points through its modular store, component, and API architecture.

---

## Extension Points

### 1. Zustand Stores (Primary Extension Point)

New domain logic is added by creating a new Zustand store in `src/store/` or extending an existing one. Stores are backed by the REST API.

**Adding a new store:**

```typescript
// src/store/exampleStore.ts
import { create } from 'zustand';
import { api } from '../lib/api';

interface ExampleState {
  items: Item[];
  fetchItems: () => Promise<void>;
}

export const useExampleStore = create<ExampleState>()((set) => ({
  items: [],
  fetchItems: async () => {
    const data = await api.get<{ items: Item[] }>('/example');
    set({ items: data.items });
  },
}));
```

Stores are self-contained and don't require registration in a central provider. Import the hook anywhere to use it.

---

### 2. API Routes

New backend functionality is added by creating route modules in `server/routes/`.

```javascript
// server/routes/example.js
const express = require('express');
const { db } = require('../db');
const { requireAuth } = require('../auth');
const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM example WHERE user_id = ?').all(req.user.id);
  res.json({ items: rows });
});

module.exports = router;
```

Mount in `server/index.js`:
```javascript
app.use('/api/example', require('./routes/example'));
```

---

### 3. Component System

Components follow a layered pattern:

```
src/components/
  ui/        ← Generic reusable primitives (badges, inputs, dialogs)
  tickets/   ← Domain-specific ticket components
  charts/    ← Data visualization (Recharts wrappers)
  layout/    ← App shell (Navbar, Footer, PageLayout)
```

**Adding a new domain module:**

1. Create `src/components/domain/` directory
2. Build components following existing patterns (`card` CSS class, `AnimatedPage` wrapper, Lucide icons)
3. Create a page in `src/pages/`
4. Add a route in `src/App.tsx`
5. Add corresponding API route in `server/routes/`

---

### 4. Activity System

Log custom events by calling `addActivity()` in any backend route:

```javascript
const { addActivity } = require('../db');

// In a route handler:
addActivity(ticketId, userId, userName, 'custom_action', 'Description of what happened');
```

Activities appear automatically in the ticket detail sidebar.

---

### 5. Notification System

Create notifications for users from any backend route:

```javascript
const { db } = require('../db');

db.prepare(
  'INSERT INTO notifications (user_id, message, ticket_number, ticket_id, type, created_at) VALUES (?, ?, ?, ?, ?, ?)'
).run(userId, 'Something happened', ticketNumber, ticketId, 'custom_type', new Date().toISOString());
```

Notifications appear in the bell icon dropdown in the navbar.

---

### 6. Rich Content Embedding

The `DescriptionWithEmbeds` component in `TicketDetails.tsx` supports extensible content detection. Currently handles:
- **Loom videos**: `loom.com/share/{id}` → embedded iframe
- **Inline images**: `{{img:N}}` → rendered from images array

To add new embed types, extend the `EMBED_REGEX` pattern and add a new render case.

---

### 7. Tailwind Theme

Brand colors and design tokens are centralized in `tailwind.config.js`:

```javascript
extend: {
  colors: {
    crane: { DEFAULT: '#d4a574', dark: '#b8935f', light: '#e8c49f', lighter: '#f5e6d3' },
    status: { open: '#ef4444', in_progress: '#f59e0b', waiting: '#3b82f6', resolved: '#22c55e' },
  },
}
```

Background gradient defined in `src/index.css`:
```css
body {
  background: linear-gradient(135deg, #161419 0%, #161519 25%, #141317 50%, #161419 75%, #121114 100%);
}
```

---

### 8. Database Schema Extension

Add new tables in `server/db.js`:

```javascript
db.exec(`
  CREATE TABLE IF NOT EXISTS my_table (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ...
  );
  CREATE INDEX IF NOT EXISTS idx_my_table_field ON my_table(field);
`);
```

For adding columns to existing tables:
```javascript
try {
  db.exec('ALTER TABLE users ADD COLUMN new_field TEXT DEFAULT NULL');
} catch { /* column already exists */ }
```

---

### 9. Paste Handler Extension

The `handleRichPaste()` function in `src/lib/paste-utils.ts` processes clipboard content. It handles:
- Direct image file paste (screenshots)
- Rich HTML content (Gmail, Outlook) with embedded images

To support additional content types, extend the function to check for new clipboard data types.
