export type UserRole = 'user' | 'admin';
export type TicketType = 'support' | 'bug' | 'feature_request' | 'general';
export type TicketStatus = 'open' | 'in_progress' | 'waiting_response' | 'resolved';
export type TicketPriority = 'low' | 'medium' | 'high';

export interface User {
  id: number;
  username: string;
  email: string;
  password: string;
  name: string;
  phone?: string;
  role: UserRole;
  avatar?: string;
  suspended?: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export interface TicketActivity {
  id: number;
  ticketId: number;
  userId?: number;
  userName: string;
  action: string;
  detail: string;
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
  assignedTo: string[];
  ccEmails: string[];
  status: TicketStatus;
  priority: TicketPriority;
  images: string[];
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  portal?: string;
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
  assignedTo?: string[];
  ccEmails?: string[];
  priority?: TicketPriority;
  images?: string[];
  portal?: string;
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
