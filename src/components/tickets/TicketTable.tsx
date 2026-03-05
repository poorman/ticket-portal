import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import StatusBadge from '../ui/StatusBadge';
import PriorityBadge from '../ui/PriorityBadge';
import TypeBadge from '../ui/TypeBadge';
import { formatDateShort } from '../../lib/ticket-utils';
import type { Ticket } from '../../types';

interface TicketTableProps {
  tickets: Ticket[];
  linkPrefix?: string;
}

export default function TicketTable({ tickets, linkPrefix = '/tickets' }: TicketTableProps) {
  const { sortField, sortOrder, setSortField } = useUIStore();

  const sorted = [...tickets].sort((a, b) => {
    const aVal = a[sortField as keyof Ticket] ?? '';
    const bVal = b[sortField as keyof Ticket] ?? '';
    const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
    return sortOrder === 'asc' ? cmp : -cmp;
  });

  const SortHeader = ({ field, children }: { field: string; children: React.ReactNode }) => (
    <th
      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-300 select-none"
      onClick={() => setSortField(field)}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        {sortField === field ? (
          sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
        ) : (
          <ArrowUpDown size={12} className="opacity-30" />
        )}
      </span>
    </th>
  );

  return (
    <div className="overflow-x-auto glass rounded-2xl">
      <table className="min-w-full divide-y divide-white/[0.06]">
        <thead className="bg-white/[0.03]">
          <tr>
            <SortHeader field="ticketNumber">Ticket</SortHeader>
            <SortHeader field="subject">Subject</SortHeader>
            <SortHeader field="status">Status</SortHeader>
            <SortHeader field="priority">Priority</SortHeader>
            <SortHeader field="type">Type</SortHeader>
            <SortHeader field="createdAt">Created</SortHeader>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.04]">
          {sorted.map((ticket, i) => (
            <motion.tr
              key={ticket.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="hover:bg-white/[0.03] transition-colors"
            >
              <td className="px-4 py-3">
                <Link
                  to={`${linkPrefix}/${ticket.id}`}
                  className="text-sm font-medium text-crane hover:text-crane-light no-underline"
                >
                  {ticket.ticketNumber}
                </Link>
              </td>
              <td className="px-4 py-3 text-sm text-gray-300 max-w-[300px] truncate">
                {ticket.subject}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={ticket.status} />
              </td>
              <td className="px-4 py-3">
                <PriorityBadge priority={ticket.priority} />
              </td>
              <td className="px-4 py-3">
                <TypeBadge type={ticket.type} />
              </td>
              <td className="px-4 py-3 text-sm text-gray-500">
                {formatDateShort(ticket.createdAt)}
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
      {sorted.length === 0 && (
        <div className="text-center py-12 text-gray-500 text-sm">No tickets found</div>
      )}
    </div>
  );
}
