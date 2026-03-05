import type { TicketStatus } from '../../types';
import { getStatusDisplay } from '../../lib/ticket-utils';

const styles: Record<TicketStatus, string> = {
  open: 'bg-red-100 text-red-700',
  in_progress: 'bg-amber-100 text-amber-700',
  waiting_response: 'bg-blue-100 text-blue-700',
  resolved: 'bg-emerald-100 text-emerald-700',
  closed: 'bg-gray-100 text-gray-600',
};

export default function StatusBadge({ status }: { status: TicketStatus }) {
  return (
    <span className={`badge ${styles[status]}`}>
      {getStatusDisplay(status)}
    </span>
  );
}
