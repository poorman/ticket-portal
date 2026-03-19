import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
  nextId: number;
  addNotification: (data: Omit<Notification, 'id' | 'read' | 'createdAt'>) => void;
  markRead: (id: number) => void;
  markAllRead: () => void;
  clearAll: () => void;
  unreadCount: () => number;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      nextId: 1,

      addNotification: (data) => {
        const notification: Notification = {
          ...data,
          id: get().nextId,
          read: false,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          notifications: [notification, ...state.notifications].slice(0, 50), // keep last 50
          nextId: state.nextId + 1,
        }));
      },

      markRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        }));
      },

      markAllRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        }));
      },

      clearAll: () => {
        set({ notifications: [] });
      },

      unreadCount: () => get().notifications.filter((n) => !n.read).length,
    }),
    { name: 'ticket-portal-notifications' }
  )
);
