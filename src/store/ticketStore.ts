import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Ticket, TicketResponse, CreateTicketInput, CreateResponseInput } from '../types';
import { useNotificationStore } from './notificationStore';

export interface SearchResult {
  ticket: Ticket;
  matchedIn: ('subject' | 'description' | 'response' | 'ticketNumber')[];
  responseSnippet?: string;
  relevanceScore: number;
}

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
  deepSearch: (query: string) => SearchResult[];

  addResponse: (data: CreateResponseInput) => TicketResponse;
  deleteResponse: (responseId: number) => void;
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
          assignedTo: data.assignedTo || [],
          ccEmails: data.ccEmails || [],
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
        useNotificationStore.getState().addNotification({
          message: `New ticket created: ${data.subject}`,
          ticketNumber: ticket.ticketNumber,
          ticketId: ticket.id,
          type: 'ticket_created',
        });
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
            const closedAt =
              updates.status === 'resolved'
                ? new Date().toISOString()
                : updates.status
                  ? undefined
                  : t.closedAt;
            updated = { ...t, ...updates, updatedAt: new Date().toISOString(), closedAt };
            return updated;
          }),
        }));
        if (updated) {
          const isClosed = updates.status === 'resolved';
          useNotificationStore.getState().addNotification({
            message: isClosed
              ? `Ticket ${isClosed ? updates.status : 'updated'}`
              : `Ticket updated${updates.status ? ` to ${updates.status.replace('_', ' ')}` : ''}${updates.priority ? `, priority: ${updates.priority}` : ''}`,
            ticketNumber: updated.ticketNumber,
            ticketId: updated.id,
            type: isClosed ? 'ticket_resolved' : 'ticket_updated',
          });
        }
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

      deepSearch: (query) => {
        const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
        if (!terms.length) return [];

        const { tickets, responses } = get();
        const results: SearchResult[] = [];

        for (const ticket of tickets) {
          const matchedIn: SearchResult['matchedIn'] = [];
          let score = 0;

          const subjectLower = ticket.subject.toLowerCase();
          const descLower = ticket.description.toLowerCase();
          const numLower = ticket.ticketNumber.toLowerCase();

          for (const term of terms) {
            if (numLower.includes(term)) {
              if (!matchedIn.includes('ticketNumber')) matchedIn.push('ticketNumber');
              score += 10;
            }
            if (subjectLower.includes(term)) {
              if (!matchedIn.includes('subject')) matchedIn.push('subject');
              score += 5;
            }
            if (descLower.includes(term)) {
              if (!matchedIn.includes('description')) matchedIn.push('description');
              score += 3;
            }
          }

          // Search responses for this ticket
          const ticketResponses = responses.filter((r) => r.ticketId === ticket.id && !r.isInternal);
          let responseSnippet: string | undefined;
          for (const resp of ticketResponses) {
            const msgLower = resp.message.toLowerCase();
            for (const term of terms) {
              if (msgLower.includes(term)) {
                if (!matchedIn.includes('response')) matchedIn.push('response');
                score += 2;
                if (!responseSnippet) {
                  const idx = msgLower.indexOf(term);
                  const start = Math.max(0, idx - 60);
                  const end = Math.min(resp.message.length, idx + term.length + 60);
                  responseSnippet = (start > 0 ? '...' : '') + resp.message.slice(start, end) + (end < resp.message.length ? '...' : '');
                }
                break;
              }
            }
          }

          // Boost resolved tickets (they likely have solutions)
          if (ticket.status === 'resolved') {
            score += 3;
          }

          if (matchedIn.length > 0) {
            results.push({ ticket, matchedIn, responseSnippet, relevanceScore: score });
          }
        }

        return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
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
        if (!data.isInternal) {
          const ticket = get().tickets.find((t) => t.id === data.ticketId);
          useNotificationStore.getState().addNotification({
            message: `New response from ${data.userName || 'Anonymous'}`,
            ticketNumber: ticket?.ticketNumber,
            ticketId: data.ticketId,
            type: 'response_added',
          });
        }
        return response;
      },

      deleteResponse: (responseId) => {
        set((state) => ({
          responses: state.responses.filter((r) => r.id !== responseId),
        }));
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
