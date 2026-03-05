import type { TicketType } from '../../types';
import { getTicketTypeDisplay } from '../../lib/ticket-utils';

export default function TypeBadge({ type }: { type: TicketType }) {
  return (
    <span className="badge bg-purple-100 text-purple-700">
      {getTicketTypeDisplay(type)}
    </span>
  );
}
