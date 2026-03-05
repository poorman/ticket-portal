import { useMemo } from 'react';
import {
  Clock,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';
import AnimatedPage from '../components/layout/AnimatedPage';
import StatCard from '../components/ui/StatCard';
import SearchInput from '../components/ui/SearchInput';
import TicketTable from '../components/tickets/TicketTable';
import StatusPieChart from '../components/charts/StatusPieChart';
import TicketsOverTimeChart from '../components/charts/TicketsOverTimeChart';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { useTicketStore } from '../store/ticketStore';
import { useUIStore } from '../store/uiStore';

export default function AdminDashboardPage() {
  const user = useRequireAuth(true);
  const tickets = useTicketStore((s) => s.tickets);
  const searchTickets = useTicketStore((s) => s.searchTickets);
  const { searchQuery, setSearchQuery } = useUIStore();

  const filteredTickets = useMemo(
    () => (searchQuery ? searchTickets(searchQuery) : tickets),
    [searchQuery, tickets, searchTickets]
  );

  const stats = useMemo(() => {
    const open = tickets.filter((t) => t.status === 'open').length;
    const inProgress = tickets.filter((t) => t.status === 'in_progress').length;
    const resolved = tickets.filter((t) => t.status === 'resolved').length;
    const closed = tickets.filter((t) => t.status === 'closed').length;
    const highPriority = tickets.filter((t) => t.priority === 'high' && t.status !== 'closed' && t.status !== 'resolved').length;
    const today = tickets.filter((t) => t.createdAt.startsWith(new Date().toISOString().split('T')[0])).length;
    const resolutionRate = tickets.length > 0 ? Math.round(((resolved + closed) / tickets.length) * 100) : 0;

    return { total: tickets.length, open, inProgress, resolved, closed, highPriority, today, resolutionRate };
  }, [tickets]);

  if (!user) return null;

  return (
    <AnimatedPage>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <span className="badge bg-crane/20 text-crane-dark">Admin</span>
            </div>
            <p className="text-gray-500 mt-1">{stats.total} total tickets</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard label="Open" value={stats.open} icon={AlertCircle} color="text-red-500" />
          <StatCard label="In Progress" value={stats.inProgress} icon={Clock} color="text-amber-500" />
          <StatCard label="Today" value={stats.today} icon={TrendingUp} color="text-blue-500" />
          <StatCard label="Resolution Rate" value={`${stats.resolutionRate}%`} icon={CheckCircle} color="text-emerald-500" />
        </div>

        {/* Priority Alert */}
        {stats.highPriority > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-8 flex items-center gap-3">
            <AlertTriangle size={20} className="text-red-500 shrink-0" />
            <p className="text-sm text-red-700">
              <strong>{stats.highPriority}</strong> high-priority ticket{stats.highPriority > 1 ? 's' : ''} need{stats.highPriority === 1 ? 's' : ''} attention
            </p>
          </div>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="card">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">Status Distribution</h3>
            <StatusPieChart tickets={tickets} />
          </div>
          <div className="card">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">Tickets Over Time</h3>
            <TicketsOverTimeChart tickets={tickets} />
          </div>
        </div>

        {/* Ticket Table */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <h2 className="text-lg font-semibold text-gray-900">All Tickets</h2>
            <div className="w-full sm:w-72">
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search tickets..."
              />
            </div>
          </div>
          <TicketTable tickets={filteredTickets} linkPrefix="/admin/tickets" />
        </div>
      </div>
    </AnimatedPage>
  );
}
