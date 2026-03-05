import type { TicketPriority } from '../../types';
import { getPriorityDisplay } from '../../lib/ticket-utils';

const styles: Record<TicketPriority, string> = {
  high: 'bg-red-500/15 text-red-400',
  medium: 'bg-amber-500/15 text-amber-400',
  low: 'bg-emerald-500/15 text-emerald-400',
};

export default function PriorityBadge({ priority }: { priority: TicketPriority }) {
  return (
    <span className={`badge ${styles[priority]}`}>
      {getPriorityDisplay(priority)}
    </span>
  );
}
