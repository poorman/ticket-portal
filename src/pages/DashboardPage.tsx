import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Ticket, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import AnimatedPage from '../components/layout/AnimatedPage';
import StatCard from '../components/ui/StatCard';
import TicketList from '../components/tickets/TicketList';
import StatusPieChart from '../components/charts/StatusPieChart';
import TicketsOverTimeChart from '../components/charts/TicketsOverTimeChart';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { useTicketStore } from '../store/ticketStore';

export default function DashboardPage() {
  const user = useRequireAuth();
  const getTicketsForUser = useTicketStore((s) => s.getTicketsForUser);
  const fetchTickets = useTicketStore((s) => s.fetchTickets);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const tickets = useMemo(
    () => (user ? getTicketsForUser(user.id, user.email) : []),
    [user, getTicketsForUser]
  );

  const stats = useMemo(() => ({
    total: tickets.length,
    open: tickets.filter((t) => t.status === 'open').length,
    inProgress: tickets.filter((t) => t.status === 'in_progress').length,
    resolved: tickets.filter((t) => t.status === 'resolved').length,
  }), [tickets]);

  const recent = tickets.slice(0, 5);

  if (!user) return null;

  return (
    <AnimatedPage>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Welcome, {user.name}</h1>
            <p className="text-gray-500 mt-1">Here's an overview of your support tickets.</p>
          </div>
          <div className="flex gap-3">
            <Link to="/submit" className="btn btn-primary no-underline">
              <Plus size={16} />
              New Ticket
            </Link>
            <Link to="/track" className="btn btn-secondary no-underline">
              <Search size={16} />
              Track
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total" value={stats.total} icon={Ticket} color="text-gray-400" />
          <StatCard label="Open" value={stats.open} icon={AlertCircle} color="text-red-500" />
          <StatCard label="In Progress" value={stats.inProgress} icon={Clock} color="text-amber-500" />
          <StatCard label="Resolved" value={stats.resolved} icon={CheckCircle} color="text-emerald-500" />
        </div>

        {/* Charts */}
        {tickets.length > 0 && (
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
        )}

        {/* Recent Tickets */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Recent Tickets</h2>
          <TicketList
            tickets={recent}
            emptyMessage="You haven't submitted any tickets yet"
          />
        </div>

        {tickets.length > 5 && (
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">All Tickets</h2>
            <TicketList tickets={tickets} />
          </div>
        )}
      </div>
    </AnimatedPage>
  );
}
