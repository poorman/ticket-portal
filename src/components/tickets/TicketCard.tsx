import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageSquare } from 'lucide-react';
import StatusBadge from '../ui/StatusBadge';
import PriorityBadge from '../ui/PriorityBadge';
import { formatDateShort } from '../../lib/ticket-utils';
import { useTicketStore } from '../../store/ticketStore';
import type { Ticket } from '../../types';

interface TicketCardProps {
  ticket: Ticket;
  linkPrefix?: string;
  showSubmitter?: boolean;
  index?: number;
}

export default function TicketCard({ ticket, linkPrefix = '/tickets', showSubmitter, index = 0 }: TicketCardProps) {
  const responseCount = useTicketStore((s) =>
    s.responses.filter((r) => r.ticketId === ticket.id).length
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link
        to={`${linkPrefix}/${ticket.id}`}
        className="card card-hover block no-underline text-inherit"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-sm font-medium text-crane">{ticket.ticketNumber}</span>
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
            </div>
            <h3 className="text-sm font-medium text-white truncate">{ticket.subject}</h3>
            {showSubmitter && (
              <p className="text-xs text-gray-500 mt-1">
                {ticket.submitterName} &middot; {ticket.submitterEmail}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="text-xs text-gray-500">{formatDateShort(ticket.createdAt)}</span>
            {responseCount > 0 && (
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <MessageSquare size={12} />
                {responseCount}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
