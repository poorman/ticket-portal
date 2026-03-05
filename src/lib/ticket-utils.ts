import type { TicketType, TicketStatus, TicketPriority } from '../types';

export function getTicketTypeDisplay(type: TicketType): string {
  const map: Record<TicketType, string> = {
    support: 'Support',
    bug: 'Bug Report',
    feature_request: 'Feature Request',
    general: 'General Inquiry',
  };
  return map[type] || type;
}

export function getStatusDisplay(status: TicketStatus): string {
  const map: Record<TicketStatus, string> = {
    open: 'Open',
    in_progress: 'In Progress',
    waiting_response: 'Waiting Response',
    resolved: 'Resolved',
    closed: 'Closed',
  };
  return map[status] || status;
}

export function getPriorityDisplay(priority: TicketPriority): string {
  const map: Record<TicketPriority, string> = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
  };
  return map[priority] || priority;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
