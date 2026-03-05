import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Search, Ticket, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import AnimatedPage from '../components/layout/AnimatedPage';
import StatCard from '../components/ui/StatCard';
import SearchInput from '../components/ui/SearchInput';
import TicketTable from '../components/tickets/TicketTable';
import { useTicketStore } from '../store/ticketStore';
import { useUIStore } from '../store/uiStore';

export default function HomePage() {
  const tickets = useTicketStore((s) => s.tickets);
  const searchTickets = useTicketStore((s) => s.searchTickets);
  const { searchQuery, setSearchQuery } = useUIStore();

  const filteredTickets = useMemo(
    () => (searchQuery ? searchTickets(searchQuery) : tickets),
    [searchQuery, tickets, searchTickets]
  );

  const stats = useMemo(() => ({
    total: tickets.length,
    open: tickets.filter((t) => t.status === 'open').length,
    inProgress: tickets.filter((t) => t.status === 'in_progress').length,
    resolved: tickets.filter((t) => t.status === 'resolved').length,
  }), [tickets]);

  return (
    <AnimatedPage>
      {/* Hero */}
      <section className="hero-gradient text-white py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <h1 className="text-3xl sm:text-4xl font-bold mb-3">Crane Network Support</h1>
            <p className="text-white/60 text-lg max-w-xl mx-auto">
              Submit and track support tickets. We're here to help.
            </p>
            <div className="flex items-center justify-center gap-3 mt-6">
              <Link to="/submit" className="btn btn-primary btn-lg no-underline shadow-lg">
                <Plus size={18} />
                New Ticket
              </Link>
              <Link to="/track" className="btn btn-lg bg-white/[0.08] text-white hover:bg-white/[0.12] border border-white/[0.12] no-underline">
                <Search size={18} />
                Track Ticket
              </Link>
            </div>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
            <StatCard label="Total" value={stats.total} icon={Ticket} color="text-gray-400" />
            <StatCard label="Open" value={stats.open} icon={AlertCircle} color="text-red-500" />
            <StatCard label="In Progress" value={stats.inProgress} icon={Clock} color="text-amber-500" />
            <StatCard label="Resolved" value={stats.resolved} icon={CheckCircle} color="text-emerald-500" />
          </div>
        </div>
      </section>

      {/* Ticket Table */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-xl font-semibold text-white">All Tickets</h2>
          <div className="w-full sm:w-72">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search tickets..."
            />
          </div>
        </div>

        <TicketTable tickets={filteredTickets} />
      </section>
    </AnimatedPage>
  );
}
