import TicketCard from './TicketCard';
import EmptyState from '../ui/EmptyState';
import { Ticket as TicketIcon } from 'lucide-react';
import type { Ticket } from '../../types';

interface TicketListProps {
  tickets: Ticket[];
  linkPrefix?: string;
  showSubmitter?: boolean;
  emptyMessage?: string;
}

export default function TicketList({
  tickets,
  linkPrefix = '/tickets',
  showSubmitter,
  emptyMessage = 'No tickets found',
}: TicketListProps) {
  if (!tickets.length) {
    return <EmptyState icon={TicketIcon} title={emptyMessage} />;
  }

  return (
    <div className="space-y-3">
      {tickets.map((ticket, i) => (
        <TicketCard
          key={ticket.id}
          ticket={ticket}
          linkPrefix={linkPrefix}
          showSubmitter={showSubmitter}
          index={i}
        />
      ))}
    </div>
  );
}
