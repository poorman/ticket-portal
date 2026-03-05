import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import AnimatedPage from '../components/layout/AnimatedPage';
import TicketDetails from '../components/tickets/TicketDetails';
import ResponseForm from '../components/tickets/ResponseForm';
import { useTicketStore } from '../store/ticketStore';
import { useAuth } from '../hooks/useAuth';
import type { Ticket } from '../types';

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, isAdmin } = useAuth();
  const getById = useTicketStore((s) => s.getTicketById);
  const [ticket, setTicket] = useState<Ticket | undefined>(undefined);
  const [email, setEmail] = useState(localStorage.getItem('track-email') || '');
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    const t = getById(Number(id));
    setTicket(t);
    if (t && user) {
      const hasAccess = isAdmin || user.id === t.userId || user.email === t.submitterEmail;
      setVerified(hasAccess);
    }
  }, [id, getById, user, isAdmin]);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (ticket && ticket.submitterEmail.toLowerCase() === email.toLowerCase()) {
      localStorage.setItem('track-email', email);
      setVerified(true);
    } else {
      toast.error('Email does not match ticket submitter');
    }
  };

  if (!ticket) {
    return (
      <AnimatedPage>
        <div className="max-w-3xl mx-auto px-4 py-8 text-center">
          <p className="text-gray-500">Ticket not found.</p>
          <Link to="/" className="text-sm text-crane-dark hover:text-crane mt-2 inline-block">
            Back to home
          </Link>
        </div>
      </AnimatedPage>
    );
  }

  if (!verified && !user) {
    return (
      <AnimatedPage>
        <div className="max-w-md mx-auto px-4 py-16">
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Verify your identity</h2>
            <p className="text-sm text-gray-500 mb-4">
              Enter the email you used when submitting this ticket.
            </p>
            <form onSubmit={handleVerify} className="space-y-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="input"
                required
              />
              <button type="submit" className="btn btn-primary w-full">
                Verify
              </button>
            </form>
            <div className="mt-4 text-center">
              <Link to="/login" className="text-sm text-crane-dark hover:text-crane">
                Or sign in to your account
              </Link>
            </div>
          </div>
        </div>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6 no-underline">
          <ArrowLeft size={14} />
          Back to home
        </Link>

        <TicketDetails ticket={ticket} showInternalNotes={isAdmin} />

        {verified && (
          <div className="card mt-6">
            <ResponseForm
              ticketId={ticket.id}
              submitterEmail={email}
              onSuccess={() => setTicket({ ...getById(Number(id))! })}
            />
          </div>
        )}
      </div>
    </AnimatedPage>
  );
}
