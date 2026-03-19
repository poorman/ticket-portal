import { useMemo } from 'react';
import { Calendar, Clock, Tag, AlertCircle, User, Mail, Phone } from 'lucide-react';
import StatusBadge from '../ui/StatusBadge';
import PriorityBadge from '../ui/PriorityBadge';
import TypeBadge from '../ui/TypeBadge';
import ImageGallery from '../ui/ImageGallery';
import ResponseTimeline from './ResponseTimeline';
import { formatDate } from '../../lib/ticket-utils';
import { useTicketStore } from '../../store/ticketStore';
import type { Ticket } from '../../types';

interface TicketDetailsProps {
  ticket: Ticket;
  showInternalNotes?: boolean;
}

export default function TicketDetails({ ticket, showInternalNotes = false }: TicketDetailsProps) {
  const allResponses = useTicketStore((s) => s.responses);
  const responses = useMemo(
    () => allResponses.filter((r) => r.ticketId === ticket.id && (showInternalNotes || !r.isInternal)),
    [allResponses, ticket.id, showInternalNotes]
  );

  return (
    <div className="space-y-6">
      {/* Ticket Info — unified card */}
      <div className="card">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-xl font-bold text-white">{ticket.ticketNumber}</h1>
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
              <TypeBadge type={ticket.type} />
            </div>
            <h2 className="text-lg font-medium text-white">{ticket.subject}</h2>
          </div>
          <div className="hidden sm:flex flex-col items-end gap-1.5 shrink-0 text-xs text-gray-500">
            <div className="flex items-center gap-1.5">
              <Tag size={12} />
              <span>{ticket.type.replace('_', ' ')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <AlertCircle size={12} />
              <span>{ticket.priority}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar size={12} />
              <span>{formatDate(ticket.createdAt)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock size={12} />
              <span>{formatDate(ticket.updatedAt)}</span>
            </div>
          </div>
        </div>
        {/* Mobile metadata */}
        <div className="sm:hidden grid grid-cols-2 gap-2 mt-3 text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <Calendar size={12} />
            <span className="truncate">{formatDate(ticket.createdAt)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock size={12} />
            <span className="truncate">{formatDate(ticket.updatedAt)}</span>
          </div>
        </div>

        {/* Description */}
        <div className="border-t border-white/[0.06] mt-4 pt-4">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Description</h3>
          <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">{ticket.description}</p>
          {ticket.images.length > 0 && (
            <div className="mt-4 pt-4 border-t border-white/[0.06]">
              <h4 className="text-sm font-medium text-gray-500 mb-2">Attachments</h4>
              <ImageGallery images={ticket.images} />
            </div>
          )}
        </div>

        {/* Contact Info & Assignment */}
        <div className="border-t border-white/[0.06] mt-4 pt-4">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Contact Information</h3>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <div className="flex items-center gap-2 text-gray-300 min-w-0">
              <User size={14} className="text-gray-500 shrink-0" />
              <span className="truncate">{ticket.submitterName}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-300 min-w-0">
              <Mail size={14} className="text-gray-500 shrink-0" />
              <span className="truncate">{ticket.submitterEmail}</span>
            </div>
            {ticket.submitterPhone && (
              <div className="flex items-center gap-2 text-gray-300">
                <Phone size={14} className="text-gray-500" />
                {ticket.submitterPhone}
              </div>
            )}
          </div>
          {(ticket.assignedTo?.length > 0 || ticket.ccEmails?.length > 0) && (
            <div className="border-t border-white/[0.06] mt-3 pt-3 space-y-2 text-sm">
              {ticket.assignedTo?.length > 0 && (
                <div>
                  <span className="text-gray-500 text-xs uppercase tracking-wide">Assigned to: </span>
                  <span className="text-crane">
                    {ticket.assignedTo.map((u) => `@${u}`).join(', ')}
                  </span>
                </div>
              )}
              {ticket.ccEmails?.length > 0 && (
                <div>
                  <span className="text-gray-500 text-xs uppercase tracking-wide">CC: </span>
                  <span className="text-gray-300">
                    {ticket.ccEmails.map((u) => `@${u}`).join(', ')}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Responses */}
      <div className="card">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">
          Responses ({responses.length})
        </h3>
        <ResponseTimeline responses={responses} />
      </div>
    </div>
  );
}
