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
  const responses = useTicketStore((s) =>
    s.getResponsesForTicket(ticket.id, showInternalNotes)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <h1 className="text-xl font-bold text-gray-900">{ticket.ticketNumber}</h1>
          <StatusBadge status={ticket.status} />
          <PriorityBadge priority={ticket.priority} />
          <TypeBadge type={ticket.type} />
        </div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">{ticket.subject}</h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2 text-gray-500">
            <Tag size={14} />
            <span>{ticket.type.replace('_', ' ')}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-500">
            <AlertCircle size={14} />
            <span>{ticket.priority}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-500">
            <Calendar size={14} />
            <span>{formatDate(ticket.createdAt)}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-500">
            <Clock size={14} />
            <span>{formatDate(ticket.updatedAt)}</span>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="card">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Description</h3>
        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{ticket.description}</p>
        {ticket.images.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <h4 className="text-sm font-medium text-gray-500 mb-2">Attachments</h4>
            <ImageGallery images={ticket.images} />
          </div>
        )}
      </div>

      {/* Contact Info */}
      <div className="card">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Contact Information</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-gray-700">
            <User size={14} className="text-gray-400" />
            {ticket.submitterName}
          </div>
          <div className="flex items-center gap-2 text-gray-700">
            <Mail size={14} className="text-gray-400" />
            {ticket.submitterEmail}
          </div>
          {ticket.submitterPhone && (
            <div className="flex items-center gap-2 text-gray-700">
              <Phone size={14} className="text-gray-400" />
              {ticket.submitterPhone}
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
