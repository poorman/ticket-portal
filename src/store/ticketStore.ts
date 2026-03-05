import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Ticket, TicketResponse, CreateTicketInput, CreateResponseInput } from '../types';

interface TicketState {
  tickets: Ticket[];
  responses: TicketResponse[];
  nextTicketId: number;
  nextTicketNumber: number;
  nextResponseId: number;

  createTicket: (data: CreateTicketInput) => Ticket;
  getTicketById: (id: number) => Ticket | undefined;
  getTicketByNumber: (num: string) => Ticket | undefined;
  getTicketsForUser: (userId: number, email: string) => Ticket[];
  updateTicket: (id: number, updates: Partial<Pick<Ticket, 'status' | 'priority'>>) => Ticket | undefined;
  deleteTicket: (id: number) => void;
  searchTickets: (query: string) => Ticket[];

  addResponse: (data: CreateResponseInput) => TicketResponse;
  getResponsesForTicket: (ticketId: number, includeInternal: boolean) => TicketResponse[];
}

export const useTicketStore = create<TicketState>()(
  persist(
    (set, get) => ({
      tickets: [],
      responses: [],
      nextTicketId: 1,
      nextTicketNumber: 1001,
      nextResponseId: 1,

      createTicket: (data) => {
        const now = new Date().toISOString();
        const ticket: Ticket = {
          id: get().nextTicketId,
          ticketNumber: `TKT-${get().nextTicketNumber}`,
          type: data.type,
          subject: data.subject,
          description: data.description,
          submitterName: data.submitterName,
          submitterEmail: data.submitterEmail,
          submitterPhone: data.submitterPhone,
          userId: data.userId,
          status: 'open',
          priority: data.priority || 'medium',
          images: data.images || [],
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          tickets: [ticket, ...state.tickets],
          nextTicketId: state.nextTicketId + 1,
          nextTicketNumber: state.nextTicketNumber + 1,
        }));
        return ticket;
      },

      getTicketById: (id) => get().tickets.find((t) => t.id === id),

      getTicketByNumber: (num) =>
        get().tickets.find((t) => t.ticketNumber.toLowerCase() === num.toLowerCase()),

      getTicketsForUser: (userId, email) =>
        get().tickets.filter(
          (t) => t.userId === userId || t.submitterEmail.toLowerCase() === email.toLowerCase()
        ),

      updateTicket: (id, updates) => {
        let updated: Ticket | undefined;
        set((state) => ({
          tickets: state.tickets.map((t) => {
            if (t.id !== id) return t;
            const closedStatuses = ['closed', 'resolved'];
            const closedAt =
              updates.status && closedStatuses.includes(updates.status)
                ? new Date().toISOString()
                : updates.status
                  ? undefined
                  : t.closedAt;
            updated = { ...t, ...updates, updatedAt: new Date().toISOString(), closedAt };
            return updated;
          }),
        }));
        return updated;
      },

      deleteTicket: (id) => {
        set((state) => ({
          tickets: state.tickets.filter((t) => t.id !== id),
          responses: state.responses.filter((r) => r.ticketId !== id),
        }));
      },

      searchTickets: (query) => {
        const q = query.toLowerCase();
        return get().tickets.filter(
          (t) =>
            t.ticketNumber.toLowerCase().includes(q) ||
            t.subject.toLowerCase().includes(q) ||
            t.description.toLowerCase().includes(q) ||
            t.submitterEmail.toLowerCase().includes(q)
        );
      },

      addResponse: (data) => {
        const response: TicketResponse = {
          id: get().nextResponseId,
          ticketId: data.ticketId,
          userId: data.userId,
          userName: data.userName,
          userRole: data.userRole,
          message: data.message,
          images: data.images || [],
          isInternal: data.isInternal || false,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          responses: [...state.responses, response],
          nextResponseId: state.nextResponseId + 1,
          tickets: state.tickets.map((t) =>
            t.id === data.ticketId ? { ...t, updatedAt: new Date().toISOString() } : t
          ),
        }));
        return response;
      },

      getResponsesForTicket: (ticketId, includeInternal) => {
        return get().responses.filter(
          (r) => r.ticketId === ticketId && (includeInternal || !r.isInternal)
        );
      },
    }),
    {
      name: 'ticket-portal-tickets',
    }
  )
);
