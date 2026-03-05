export type UserRole = 'user' | 'admin';
export type TicketType = 'support' | 'bug' | 'feature_request' | 'general';
export type TicketStatus = 'open' | 'in_progress' | 'waiting_response' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high';

export interface User {
  id: number;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

export interface Ticket {
  id: number;
  ticketNumber: string;
  type: TicketType;
  subject: string;
  description: string;
  submitterName: string;
  submitterEmail: string;
  submitterPhone?: string;
  userId?: number;
  status: TicketStatus;
  priority: TicketPriority;
  images: string[];
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
}

export interface TicketResponse {
  id: number;
  ticketId: number;
  userId?: number;
  userName?: string;
  userRole?: UserRole;
  message: string;
  images: string[];
  isInternal: boolean;
  createdAt: string;
}

export interface CreateTicketInput {
  type: TicketType;
  subject: string;
  description: string;
  submitterName: string;
  submitterEmail: string;
  submitterPhone?: string;
  userId?: number;
  priority?: TicketPriority;
  images?: string[];
}

export interface CreateResponseInput {
  ticketId: number;
  userId?: number;
  userName?: string;
  userRole?: UserRole;
  message: string;
  images?: string[];
  isInternal?: boolean;
}
