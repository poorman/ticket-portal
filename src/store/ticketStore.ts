import { create } from 'zustand';
import type { Ticket, TicketResponse, CreateTicketInput, CreateResponseInput } from '../types';
import { api } from '../lib/api';

export interface SearchResult {
  ticket: Ticket;
  matchedIn: ('subject' | 'description' | 'response' | 'ticketNumber')[];
  responseSnippet?: string;
  relevanceScore: number;
}

interface TicketState {
  tickets: Ticket[];
  responses: TicketResponse[];
  responseCounts: Record<number, number>;
  loading: boolean;

  fetchTickets: () => Promise<void>;
  fetchTicketDetail: (id: number) => Promise<{ ticket: Ticket; responses: TicketResponse[] } | null>;
  createTicket: (data: CreateTicketInput) => Promise<Ticket>;
  getTicketById: (id: number) => Ticket | undefined;
  getTicketByNumber: (num: string) => Promise<Ticket | undefined>;
  getTicketsForUser: (userId: number, email: string) => Ticket[];
  updateTicket: (id: number, updates: Partial<Pick<Ticket, 'status' | 'priority'>>) => Promise<Ticket | undefined>;
  resolveTicket: (id: number) => Promise<Ticket | undefined>;
  deleteTicket: (id: number) => Promise<void>;
  searchTickets: (query: string) => Ticket[];
  deepSearch: (query: string) => Promise<SearchResult[]>;

  addResponse: (data: CreateResponseInput) => Promise<TicketResponse>;
  deleteResponse: (responseId: number) => Promise<void>;
  getResponsesForTicket: (ticketId: number, includeInternal: boolean) => TicketResponse[];
}

export const useTicketStore = create<TicketState>()((set, get) => ({
  tickets: [],
  responses: [],
  responseCounts: {},
  loading: false,

  fetchTickets: async () => {
    set({ loading: true });
    try {
      const data = await api.get<{ tickets: Ticket[]; responseCounts: Record<number, number> }>('/tickets');
      set({ tickets: data.tickets, responseCounts: data.responseCounts, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  fetchTicketDetail: async (id) => {
    try {
      const data = await api.get<{ ticket: Ticket; responses: TicketResponse[] }>(`/tickets/${id}`);
      set((state) => ({
        tickets: state.tickets.some((t) => t.id === id)
          ? state.tickets.map((t) => (t.id === id ? data.ticket : t))
          : [...state.tickets, data.ticket],
        responses: [
          ...state.responses.filter((r) => r.ticketId !== id),
          ...data.responses,
        ],
      }));
      return data;
    } catch {
      return null;
    }
  },

  createTicket: async (data) => {
    const res = await api.post<{ ticket: Ticket }>('/tickets', data);
    set((state) => ({ tickets: [res.ticket, ...state.tickets] }));
    return res.ticket;
  },

  getTicketById: (id) => get().tickets.find((t) => t.id === id),

  getTicketByNumber: async (num) => {
    try {
      const data = await api.get<{ ticket: Ticket }>(`/tickets/by-number/${encodeURIComponent(num)}`);
      set((state) => ({
        tickets: state.tickets.some((t) => t.id === data.ticket.id)
          ? state.tickets.map((t) => (t.id === data.ticket.id ? data.ticket : t))
          : [...state.tickets, data.ticket],
      }));
      return data.ticket;
    } catch {
      return undefined;
    }
  },

  getTicketsForUser: (userId, email) =>
    get().tickets.filter(
      (t) => t.userId === userId || t.submitterEmail.toLowerCase() === email.toLowerCase()
    ),

  updateTicket: async (id, updates) => {
    try {
      const data = await api.put<{ ticket: Ticket }>(`/tickets/${id}`, updates);
      set((state) => ({
        tickets: state.tickets.map((t) => (t.id === id ? data.ticket : t)),
      }));
      return data.ticket;
    } catch {
      return undefined;
    }
  },

  resolveTicket: async (id) => {
    try {
      const data = await api.post<{ ticket: Ticket }>(`/tickets/${id}/resolve`);
      set((state) => ({
        tickets: state.tickets.map((t) => (t.id === id ? data.ticket : t)),
      }));
      return data.ticket;
    } catch {
      return undefined;
    }
  },

  deleteTicket: async (id) => {
    await api.delete(`/tickets/${id}`);
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

  deepSearch: async (query) => {
    try {
      const data = await api.get<{ results: SearchResult[] }>(`/tickets/search?q=${encodeURIComponent(query)}`);
      return data.results;
    } catch {
      return [];
    }
  },

  addResponse: async (data) => {
    const res = await api.post<{ response: TicketResponse }>(`/tickets/${data.ticketId}/responses`, data);
    set((state) => ({
      responses: [...state.responses, res.response],
      tickets: state.tickets.map((t) =>
        t.id === data.ticketId ? { ...t, updatedAt: new Date().toISOString() } : t
      ),
      responseCounts: {
        ...state.responseCounts,
        [data.ticketId]: (state.responseCounts[data.ticketId] || 0) + 1,
      },
    }));
    return res.response;
  },

  deleteResponse: async (responseId) => {
    await api.delete(`/tickets/responses/${responseId}`);
    set((state) => ({
      responses: state.responses.filter((r) => r.id !== responseId),
    }));
  },

  getResponsesForTicket: (ticketId, includeInternal) => {
    return get().responses.filter(
      (r) => r.ticketId === ticketId && (includeInternal || !r.isInternal)
    );
  },
}));
