import type { TicketStatus } from '../../types';
import { getStatusDisplay } from '../../lib/ticket-utils';

const styles: Record<TicketStatus, string> = {
  open: 'bg-red-500/15 text-red-400',
  in_progress: 'bg-amber-500/15 text-amber-400',
  waiting_response: 'bg-blue-500/15 text-blue-400',
  resolved: 'bg-emerald-500/15 text-emerald-400',
};

export default function StatusBadge({ status }: { status: TicketStatus }) {
  return (
    <span className={`badge ${styles[status]}`}>
      {getStatusDisplay(status)}
    </span>
  );
}
