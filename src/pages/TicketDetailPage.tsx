import { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, Lock, Mail, PartyPopper } from 'lucide-react';
import toast from 'react-hot-toast';
import AnimatedPage from '../components/layout/AnimatedPage';
import TicketDetails from '../components/tickets/TicketDetails';
import ResponseForm from '../components/tickets/ResponseForm';
import confetti from 'canvas-confetti';
import { useTicketStore } from '../store/ticketStore';
import { useReadStore } from '../store/readStore';
import { useAuth } from '../hooks/useAuth';
import type { Ticket } from '../types';

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const fromSearch = searchParams.get('from') === 'search';
  const { user, isAdmin } = useAuth();
  const tickets = useTicketStore((s) => s.tickets);
  const responses = useTicketStore((s) => s.responses);
  const getById = useTicketStore((s) => s.getTicketById);
  const updateTicket = useTicketStore((s) => s.updateTicket);
  const markSeen = useReadStore((s) => s.markSeen);
  const [ticket, setTicket] = useState<Ticket | undefined>(undefined);
  const [verified, setVerified] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [email, setEmail] = useState(localStorage.getItem('track-email') || '');
  const [showVerify, setShowVerify] = useState(false);

  useEffect(() => {
    const t = getById(Number(id));
    setTicket(t);
    setLoaded(true);
    if (t && user) {
      const hasAccess = isAdmin || user.id === t.userId || user.email === t.submitterEmail;
      setVerified(hasAccess);
    }
    if (t) {
      const count = responses.filter((r) => r.ticketId === t.id).length;
      markSeen(t.id, count);
    }
  }, [id, tickets, responses, getById, user, isAdmin, markSeen]);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (ticket && ticket.submitterEmail.toLowerCase() === email.toLowerCase()) {
      localStorage.setItem('track-email', email);
      setVerified(true);
      setShowVerify(false);
      toast.success('Email verified — you can now respond');
    } else {
      toast.error('Email does not match ticket submitter');
    }
  };

  if (!loaded) {
    return (
      <AnimatedPage>
        <div className="max-w-3xl mx-auto px-4 py-8 text-center">
          <p className="text-gray-500">Loading...</p>
        </div>
      </AnimatedPage>
    );
  }

  if (!ticket) {
    return (
      <AnimatedPage>
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <div className="card inline-block px-8 py-6">
            <p className="text-lg text-white font-medium mb-2">Ticket not found</p>
            <p className="text-sm text-gray-400 mb-4">This ticket may have been deleted or doesn't exist.</p>
            <Link to="/" className="text-sm text-crane hover:text-crane-light">
              Back to home
            </Link>
          </div>
        </div>
      </AnimatedPage>
    );
  }

  const canRespond = !!user || verified;

  const ticketResponses = responses.filter((r) => r.ticketId === ticket.id);
  const isSubmitter = user?.id === ticket.userId || (verified && email.toLowerCase() === ticket.submitterEmail.toLowerCase());
  const assigned = ticket.assignedTo ?? [];
  const isAssigned = user ? assigned.includes(String(user.id)) || assigned.includes(user.username ?? '') || assigned.includes(user.name) : false;
  const canResolve = (isSubmitter || isAssigned) && ticketResponses.length > 0 && ticket.status !== 'resolved';

  const handleResolve = () => {
    updateTicket(ticket.id, { status: 'resolved' });
    setTicket({ ...getById(ticket.id)!, status: 'resolved' });
    toast.success('Ticket resolved!');
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.7 },
      colors: ['#d4a574', '#f5d5a0', '#fff', '#b8860b'],
    });
  };

  return (
    <AnimatedPage>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link
          to={fromSearch ? '/search' : '/'}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-300 mb-6 no-underline"
        >
          <ArrowLeft size={14} />
          {fromSearch ? 'Back to search' : 'Back to home'}
        </Link>

        <TicketDetails ticket={ticket} showInternalNotes={isAdmin} />

        {!canRespond && !showVerify && (
          <div className="card mt-6 flex flex-col sm:flex-row items-start sm:items-center gap-3 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Lock size={14} />
              <span>Sign in or verify your email to respond.</span>
            </div>
            <div className="flex gap-2 sm:ml-auto">
              <Link to="/login" className="btn btn-sm bg-white/[0.06] text-gray-300 hover:text-white no-underline">
                Sign in
              </Link>
              <button
                onClick={() => setShowVerify(true)}
                className="btn btn-sm btn-primary"
              >
                Verify Email
              </button>
            </div>
          </div>
        )}

        {!canRespond && showVerify && (
          <div className="card mt-6">
            <h3 className="text-sm font-medium text-white mb-3">Verify your identity</h3>
            <p className="text-xs text-gray-400 mb-3">Enter the email you used when submitting this ticket.</p>
            <form onSubmit={handleVerify} className="flex gap-2">
              <div className="relative flex-1">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="input pl-10"
                  required
                  autoFocus
                />
              </div>
              <button type="submit" className="btn btn-primary shrink-0">Verify</button>
              <button
                type="button"
                onClick={() => setShowVerify(false)}
                className="btn btn-sm bg-white/[0.06] text-gray-400 hover:text-white shrink-0"
              >
                Cancel
              </button>
            </form>
          </div>
        )}

        {canResolve && (
          <div className="flex justify-center mt-6">
            <button
              onClick={handleResolve}
              className="btn bg-gradient-to-r from-crane/80 to-amber-600/80 text-white hover:from-crane hover:to-amber-600 px-8 py-3 text-base font-semibold shadow-lg shadow-crane/20 transition-all hover:scale-105 cursor-pointer"
            >
              <PartyPopper size={18} />
              Resolve It
            </button>
          </div>
        )}

        {canRespond && (
          <div className="card mt-6">
            <ResponseForm
              ticketId={ticket.id}
              submitterEmail={user?.email || email}
              onSuccess={() => setTicket({ ...getById(Number(id))! })}
            />
          </div>
        )}
      </div>
    </AnimatedPage>
  );
}
