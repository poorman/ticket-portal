import type { TicketType } from '../../types';
import { getTicketTypeDisplay } from '../../lib/ticket-utils';

export default function TypeBadge({ type }: { type: TicketType }) {
  return (
    <span className="badge bg-purple-500/15 text-purple-400">
      {getTicketTypeDisplay(type)}
    </span>
  );
}
