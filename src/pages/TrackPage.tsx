import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import AnimatedPage from '../components/layout/AnimatedPage';
import TicketDetails from '../components/tickets/TicketDetails';
import ResponseForm from '../components/tickets/ResponseForm';
import { useTicketStore } from '../store/ticketStore';
import type { Ticket } from '../types';

export default function TrackPage() {
  const [searchParams] = useSearchParams();
  const getByNumber = useTicketStore((s) => s.getTicketByNumber);
  const [ticketNumber, setTicketNumber] = useState(searchParams.get('ticket') || '');
  const [email, setEmail] = useState(searchParams.get('email') || localStorage.getItem('track-email') || '');
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (searchParams.get('ticket') && searchParams.get('email')) {
      handleSearch();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!ticketNumber.trim() || !email.trim()) {
      toast.error('Please enter ticket number and email');
      return;
    }

    const found = await getByNumber(ticketNumber.trim());
    setSearched(true);

    if (found && found.submitterEmail.toLowerCase() === email.toLowerCase()) {
      setTicket(found);
      localStorage.setItem('track-email', email);
    } else {
      setTicket(null);
      toast.error('No ticket found matching that number and email');
    }
  };

  return (
    <AnimatedPage>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-300 mb-6 no-underline">
          <ArrowLeft size={14} />
          Back to home
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Track Your Ticket</h1>
          <p className="text-gray-500 mt-1">Enter your ticket number and email to check the status.</p>
        </div>

        <div className="card mb-6">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={ticketNumber}
              onChange={(e) => setTicketNumber(e.target.value)}
              placeholder="TKT-1001"
              className="input flex-1"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="input flex-1"
            />
            <button type="submit" className="btn btn-primary shrink-0">
              <Search size={16} />
              Search
            </button>
          </form>
        </div>

        {ticket && (
          <>
            <TicketDetails ticket={ticket} />
            <div className="card mt-6">
              <ResponseForm
                ticketId={ticket.id}
                submitterEmail={email}
                onSuccess={async () => {
                  const refreshed = await getByNumber(ticketNumber.trim());
                  if (refreshed) setTicket({ ...refreshed });
                }}
              />
            </div>
          </>
        )}

        {searched && !ticket && (
          <div className="card text-center py-12">
            <p className="text-gray-400">No ticket found matching your search.</p>
            <p className="text-sm text-gray-500 mt-2">
              Make sure the ticket number and email are correct.
            </p>
          </div>
        )}
      </div>
    </AnimatedPage>
  );
}
