import type { TicketPriority } from '../../types';
import { getPriorityDisplay } from '../../lib/ticket-utils';

const styles: Record<TicketPriority, string> = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-emerald-100 text-emerald-700',
};

export default function PriorityBadge({ priority }: { priority: TicketPriority }) {
  return (
    <span className={`badge ${styles[priority]}`}>
      {getPriorityDisplay(priority)}
    </span>
  );
}
