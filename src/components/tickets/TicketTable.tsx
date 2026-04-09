import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowUpDown, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, MessageSquare, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useUIStore } from '../../store/uiStore';
import { useTicketStore } from '../../store/ticketStore';
import { usePortalStore } from '../../store/portalStore';
import { useReadStore } from '../../store/readStore';
import ConfirmDialog from '../ui/ConfirmDialog';
import StatusBadge from '../ui/StatusBadge';
import PriorityBadge from '../ui/PriorityBadge';
import TypeBadge from '../ui/TypeBadge';
import { formatDateShort } from '../../lib/ticket-utils';
import type { Ticket } from '../../types';

const PAGE_SIZE = 10;

interface TicketTableProps {
  tickets: Ticket[];
  linkPrefix?: string;
  showDelete?: boolean;
}

export default function TicketTable({ tickets, linkPrefix = '/tickets', showDelete = false }: TicketTableProps) {
  const { sortField, sortOrder, setSortField } = useUIStore();
  const responseCounts = useTicketStore((s) => s.responseCounts);
  const deleteTicket = useTicketStore((s) => s.deleteTicket);
  const fetchTickets = useTicketStore((s) => s.fetchTickets);
  const activePortal = usePortalStore((s) => s.activePortal);
  const seenCounts = useReadStore((s) => s.seenCounts);
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<Ticket | null>(null);

  const getResponseCount = (ticketId: number) =>
    responseCounts[ticketId] ?? 0;

  const hasNewResponses = (ticketId: number): boolean => {
    const currentCount = getResponseCount(ticketId);
    const seen = seenCounts[ticketId] ?? 0;
    return currentCount > seen;
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteTicket(deleteTarget.id);
    toast.success(`${deleteTarget.ticketNumber} deleted`);
    setDeleteTarget(null);
    await fetchTickets(activePortal);
  };

  const sorted = [...tickets].sort((a, b) => {
    let aVal: string;
    let bVal: string;
    if (sortField === 'lastResponse') {
      aVal = a.updatedAt;
      bVal = b.updatedAt;
    } else {
      aVal = String(a[sortField as keyof Ticket] ?? '');
      bVal = String(b[sortField as keyof Ticket] ?? '');
    }
    const cmp = aVal.localeCompare(bVal, undefined, { numeric: true });
    return sortOrder === 'asc' ? cmp : -cmp;
  });

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const safePage = Math.min(page, Math.max(0, totalPages - 1));
  const paged = sorted.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  const SortHeader = ({ field, children }: { field: string; children: React.ReactNode }) => (
    <th
      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-300 select-none"
      onClick={() => { setSortField(field); setPage(0); }}
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

  const Pagination = () => {
    if (totalPages <= 1) return null;
    return (
      <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.06]">
        <span className="text-xs text-gray-500">
          {safePage * PAGE_SIZE + 1}–{Math.min((safePage + 1) * PAGE_SIZE, sorted.length)} of {sorted.length}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage(Math.max(0, safePage - 1))}
            disabled={safePage === 0}
            className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-white/[0.06] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ChevronLeft size={16} />
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              className={`min-w-[28px] h-7 rounded text-xs font-medium transition-colors cursor-pointer ${
                i === safePage
                  ? 'bg-crane/20 text-crane'
                  : 'text-gray-500 hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              {i + 1}
            </button>
          )).slice(
            // Show at most 5 page buttons centered around current
            Math.max(0, safePage - 2),
            Math.min(totalPages, safePage + 3)
          )}
          {safePage + 3 < totalPages && <span className="text-gray-600 text-xs px-1">...</span>}
          <button
            onClick={() => setPage(Math.min(totalPages - 1, safePage + 1))}
            disabled={safePage >= totalPages - 1}
            className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-white/[0.06] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Mobile card view */}
      <div className="md:hidden space-y-3">
        {paged.map((ticket, i) => {
          const respCount = getResponseCount(ticket.id);
          return (
            <motion.div
              key={ticket.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <div className="card card-hover block relative">
                <Link
                  to={`${linkPrefix}/${ticket.id}`}
                  className="block no-underline text-inherit"
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h3 className="text-sm font-medium text-white truncate flex-1 flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${
                        ticket.priority === 'high' ? 'bg-red-400' : ticket.priority === 'medium' ? 'bg-amber-400' : 'bg-emerald-400'
                      }`} />
                      {ticket.subject}
                      {hasNewResponses(ticket.id) && (
                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-crane/20 text-crane leading-none ml-1.5 align-middle">new</span>
                      )}
                    </h3>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-[11px] text-crane font-medium">{ticket.ticketNumber}</span>
                      <span className="text-[10px] text-gray-500">{formatDateShort(ticket.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <StatusBadge status={ticket.status} />
                    <TypeBadge type={ticket.type} />
                    {respCount > 0 && (
                      <span className="inline-flex items-center gap-1 text-xs text-gray-500 ml-auto">
                        <MessageSquare size={12} />
                        {respCount}
                      </span>
                    )}
                  </div>
                </Link>
                {showDelete && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteTarget(ticket); }}
                    className="absolute top-3 right-3 p-1.5 rounded text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                    title="Delete ticket"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
        {sorted.length === 0 && (
          <div className="text-center py-12 text-gray-500 text-sm">No tickets found</div>
        )}
        <Pagination />
      </div>

      {/* Desktop table view */}
      <div className="hidden md:block overflow-x-auto glass">
        <table className="min-w-full divide-y divide-white/[0.06]">
          <thead className="bg-white/[0.03]">
            <tr>
              <SortHeader field="ticketNumber">Ticket</SortHeader>
              <SortHeader field="subject">Subject</SortHeader>
              <SortHeader field="status">Status</SortHeader>
              <SortHeader field="priority">Priority</SortHeader>
              <SortHeader field="type">Type</SortHeader>
              <SortHeader field="lastResponse">Responses</SortHeader>
              <SortHeader field="createdAt">Created</SortHeader>
              {showDelete && <th className="px-4 py-3 w-10"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {paged.map((ticket, i) => (
              <motion.tr
                key={ticket.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="hover:bg-white/[0.03] transition-colors cursor-pointer"
                onClick={() => navigate(`${linkPrefix}/${ticket.id}`)}
              >
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="text-sm font-medium text-crane">
                      {ticket.ticketNumber}
                    </span>
                    {hasNewResponses(ticket.id) && (
                      <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-crane/20 text-crane leading-none">new</span>
                    )}
                  </span>
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
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1.5 text-sm text-gray-400">
                    <MessageSquare size={13} className="text-gray-500" />
                    {getResponseCount(ticket.id)}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {formatDateShort(ticket.createdAt)}
                </td>
                {showDelete && (
                  <td className="px-4 py-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteTarget(ticket); }}
                      className="p-1.5 rounded text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                      title="Delete ticket"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                )}
              </motion.tr>
            ))}
          </tbody>
        </table>
        {sorted.length === 0 && (
          <div className="text-center py-12 text-gray-500 text-sm">No tickets found</div>
        )}
        <Pagination />
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Ticket"
        message={deleteTarget ? `Are you sure you want to delete ${deleteTarget.ticketNumber}? This action cannot be undone.` : ''}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
