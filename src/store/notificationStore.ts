import { create } from 'zustand';
import { api } from '../lib/api';

export interface Notification {
  id: number;
  message: string;
  ticketNumber?: string;
  ticketId?: number;
  type: 'ticket_created' | 'ticket_updated' | 'response_added' | 'ticket_resolved';
  read: boolean;
  createdAt: string;
}

interface NotificationState {
  notifications: Notification[];
  fetchNotifications: () => Promise<void>;
  markRead: (id: number) => Promise<void>;
  markAllRead: () => Promise<void>;
  clearAll: () => Promise<void>;
  unreadCount: () => number;
}

export const useNotificationStore = create<NotificationState>()((set, get) => ({
  notifications: [],

  fetchNotifications: async () => {
    try {
      const data = await api.get<{ notifications: Notification[] }>('/notifications');
      set({ notifications: data.notifications });
    } catch {
      // Not logged in
    }
  },

  markRead: async (id) => {
    try {
      await api.post(`/notifications/${id}/read`);
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n
        ),
      }));
    } catch {
      // ignore
    }
  },

  markAllRead: async () => {
    try {
      await api.post('/notifications/read-all');
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
      }));
    } catch {
      // ignore
    }
  },

  clearAll: async () => {
    try {
      await api.delete('/notifications');
      set({ notifications: [] });
    } catch {
      // ignore
    }
  },

  unreadCount: () => get().notifications.filter((n) => !n.read).length,
}));
