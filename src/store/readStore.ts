import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ReadState {
  // ticketId -> last seen response count
  seenCounts: Record<number, number>;
  markSeen: (ticketId: number, responseCount: number) => void;
  getSeenCount: (ticketId: number) => number;
}

export const useReadStore = create<ReadState>()(
  persist(
    (set, get) => ({
      seenCounts: {},
      markSeen: (ticketId, responseCount) =>
        set((state) => ({
          seenCounts: { ...state.seenCounts, [ticketId]: responseCount },
        })),
      getSeenCount: (ticketId) => get().seenCounts[ticketId] ?? 0,
    }),
    { name: 'ticket-portal-read' }
  )
);
