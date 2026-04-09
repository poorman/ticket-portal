import { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, Mail, PartyPopper, Pencil, Save, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import AnimatedPage from '../components/layout/AnimatedPage';
import TicketDetails from '../components/tickets/TicketDetails';
import ResponseForm from '../components/tickets/ResponseForm';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import confetti from 'canvas-confetti';
import { useTicketStore } from '../store/ticketStore';
import { useAuthStore } from '../store/authStore';
import { useReadStore } from '../store/readStore';
import { useAuth } from '../hooks/useAuth';
import type { Ticket, TicketActivity } from '../types';

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const fromSearch = searchParams.get('from') === 'search';
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const responses = useTicketStore((s) => s.responses);
  const fetchTicketDetail = useTicketStore((s) => s.fetchTicketDetail);
  const updateTicket = useTicketStore((s) => s.updateTicket);
  const deleteTicket = useTicketStore((s) => s.deleteTicket);
  const resolveTicket = useTicketStore((s) => s.resolveTicket);
  const allUsers = useAuthStore((s) => s.users);
  const markSeen = useReadStore((s) => s.markSeen);
  const [ticket, setTicket] = useState<Ticket | undefined>(undefined);
  const [activities, setActivities] = useState<TicketActivity[]>([]);
  const [verified, setVerified] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [email, setEmail] = useState(localStorage.getItem('track-email') || '');
  const [showVerify, setShowVerify] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState<string[]>([]);
  const [ccEmails, setCcEmails] = useState<string[]>([]);

  const availableUsers = useMemo(
    () => allUsers.filter((u) => !u.suspended && u.username).map((u) => ({ username: u.username!, name: u.name })),
    [allUsers]
  );
  const validUsernames = useMemo(() => new Set(availableUsers.map((u) => u.username)), [availableUsers]);

  useEffect(() => {
    const numId = Number(id);
    fetchTicketDetail(numId).then((data) => {
      if (data) {
        setTicket(data.ticket);
        setActivities(data.activities || []);
        setSubject(data.ticket.subject);
        setDescription(data.ticket.description);
        setAssignedTo(data.ticket.assignedTo ?? []);
        setCcEmails(data.ticket.ccEmails ?? []);
        if (user) {
          const hasAccess = isAdmin || user.id === data.ticket.userId || user.email === data.ticket.submitterEmail;
          setVerified(hasAccess);
        }
        markSeen(data.ticket.id, data.responses.length);
      }
      setLoaded(true);
    });
  }, [id, fetchTicketDetail, user, isAdmin, markSeen]);

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

  const handleSaveEdit = async () => {
    if (!ticket) return;
    const updated = await updateTicket(ticket.id, { subject, description, assignedTo, ccEmails });
    if (updated) {
      setTicket(updated);
      toast.success('Ticket updated');
      setEditing(false);
      // Refresh to get updated activities
      const data = await fetchTicketDetail(ticket.id);
      if (data) setActivities(data.activities || []);
    } else {
      toast.error('Failed to update ticket');
    }
  };

  if (!loaded) {
    return (
      <AnimatedPage>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 text-center">
          <p className="text-gray-500">Loading...</p>
        </div>
      </AnimatedPage>
    );
  }

  if (!ticket) {
    return (
      <AnimatedPage>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 text-center">
          <div className="card inline-block px-8 py-6">
            <p className="text-lg text-white font-medium mb-2">Ticket not found</p>
            <p className="text-sm text-gray-400 mb-4">This ticket may have been deleted or doesn't exist.</p>
            <Link to="/" className="text-sm text-crane hover:text-crane-light">Back to home</Link>
          </div>
        </div>
      </AnimatedPage>
    );
  }

  const canRespond = !!user || verified;
  const isSubmitter = user?.id === ticket.userId || (verified && email.toLowerCase() === ticket.submitterEmail.toLowerCase());
  const assigned = ticket.assignedTo ?? [];
  const isAssigned = user ? assigned.includes(String(user.id)) || assigned.includes(user.username ?? '') || assigned.includes(user.name) : false;
  const ticketResponses = responses.filter((r) => r.ticketId === ticket.id);
  const isMentioned = user ? ticketResponses.some((r) => r.message.toLowerCase().includes(`@${(user.username ?? '').toLowerCase()}`)) : false;
  const canEdit = isAdmin || isSubmitter || isAssigned || isMentioned;
  const canDelete = isAdmin || isSubmitter;
  const canResolve = (isSubmitter || isAssigned || isMentioned) && ticketResponses.length > 0 && ticket.status !== 'resolved';

  const handleDelete = async () => {
    await deleteTicket(ticket.id);
    toast.success('Ticket deleted');
    navigate(isAdmin ? '/admin' : '/dashboard');
  };

  const handleResolve = async () => {
    const resolved = await resolveTicket(ticket.id);
    if (resolved) setTicket(resolved);
    toast.success('Ticket resolved!');
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.7 }, colors: ['#d4a574', '#f5d5a0', '#fff', '#b8860b'] });
    const data = await fetchTicketDetail(ticket.id);
    if (data) setActivities(data.activities || []);
  };

  return (
    <AnimatedPage>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/[0.06]">
          <Link
            to={fromSearch ? '/search' : '/'}
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-300 no-underline"
          >
            <ArrowLeft size={14} />
            {fromSearch ? 'Back to search' : 'Back to home'}
          </Link>
          <div className="flex items-center gap-2">
            {canEdit && !editing && (
              <button onClick={() => setEditing(true)} className="btn btn-sm bg-white/[0.06] text-gray-300 hover:text-white cursor-pointer">
                <Pencil size={13} />
                Edit
              </button>
            )}
            {canDelete && !editing && (
              <button onClick={() => setShowDelete(true)} className="btn btn-sm bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 cursor-pointer">
                <Trash2 size={13} />
                Delete
              </button>
            )}
          </div>
        </div>

        {editing ? (
          <div className="card space-y-4 mb-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Edit Ticket</h3>
              <button onClick={() => { setEditing(false); setSubject(ticket.subject); setDescription(ticket.description); setAssignedTo(ticket.assignedTo ?? []); setCcEmails(ticket.ccEmails ?? []); }} className="text-xs text-gray-500 hover:text-white cursor-pointer">Cancel</button>
            </div>
            <div>
              <label className="label">Subject</label>
              <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} className="input" />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={6} className="input" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Assigned To</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {assignedTo.filter((un) => un && validUsernames.has(un)).map((username) => (
                    <span key={username} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-crane/20 text-crane">
                      @{username}
                      <button type="button" onClick={() => setAssignedTo((prev) => prev.filter((a) => a !== username))} className="hover:text-white cursor-pointer"><X size={12} /></button>
                    </span>
                  ))}
                </div>
                <select className="select" value="" onChange={(e) => { const v = e.target.value; if (v) setAssignedTo([...assignedTo, v]); }}>
                  <option value="">Add person...</option>
                  {availableUsers.filter((u) => !assignedTo.includes(u.username)).map((u) => (<option key={u.username} value={u.username}>@{u.username}</option>))}
                </select>
              </div>
              <div>
                <label className="label">CC</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {ccEmails.filter((un) => un && validUsernames.has(un)).map((username) => (
                    <span key={username} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-white/[0.06] text-gray-300">
                      @{username}
                      <button type="button" onClick={() => setCcEmails((prev) => prev.filter((c) => c !== username))} className="hover:text-white cursor-pointer"><X size={12} /></button>
                    </span>
                  ))}
                </div>
                <select className="select" value="" onChange={(e) => { const v = e.target.value; if (v) setCcEmails([...ccEmails, v]); }}>
                  <option value="">Add person...</option>
                  {availableUsers.filter((u) => !ccEmails.includes(u.username)).map((u) => (<option key={u.username} value={u.username}>@{u.username}</option>))}
                </select>
              </div>
            </div>
            <button onClick={handleSaveEdit} className="btn btn-primary">
              <Save size={16} /> Save Changes
            </button>
          </div>
        ) : (
          <TicketDetails ticket={ticket} showInternalNotes={isAdmin} activities={activities} />
        )}

        {/* Action buttons */}
        {!editing && (
          <div className="mt-6 space-y-4">
            {!canRespond && !showVerify && (
              <div className="card flex flex-col sm:flex-row items-start sm:items-center gap-3 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <Lock size={14} />
                  <span>Sign in or verify your email to respond.</span>
                </div>
                <div className="flex gap-2 sm:ml-auto">
                  <Link to="/login" className="btn btn-sm bg-white/[0.06] text-gray-300 hover:text-white no-underline">Sign in</Link>
                  <button onClick={() => setShowVerify(true)} className="btn btn-sm btn-primary">Verify Email</button>
                </div>
              </div>
            )}

            {!canRespond && showVerify && (
              <div className="card">
                <h3 className="text-sm font-medium text-white mb-3">Verify your identity</h3>
                <p className="text-xs text-gray-400 mb-3">Enter the email you used when submitting this ticket.</p>
                <form onSubmit={handleVerify} className="flex gap-2">
                  <div className="relative flex-1">
                    <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" className="input pl-10" required autoFocus />
                  </div>
                  <button type="submit" className="btn btn-primary shrink-0">Verify</button>
                  <button type="button" onClick={() => setShowVerify(false)} className="btn btn-sm bg-white/[0.06] text-gray-400 hover:text-white shrink-0">Cancel</button>
                </form>
              </div>
            )}

            {canResolve && (
              <div className="flex justify-center">
                <button onClick={handleResolve} className="btn bg-gradient-to-r from-crane/80 to-amber-600/80 text-white hover:from-crane hover:to-amber-600 px-8 py-3 text-base font-semibold shadow-lg shadow-crane/20 transition-all hover:scale-105 cursor-pointer">
                  <PartyPopper size={18} /> Resolve It
                </button>
              </div>
            )}

            {canRespond && (
              <div className="lg:max-w-[calc(100%-320px-1.5rem)]">
                <div className="card">
                  <ResponseForm
                    ticketId={ticket.id}
                    submitterEmail={user?.email || email}
                    onSuccess={async () => {
                      const data = await fetchTicketDetail(Number(id));
                      if (data) { setTicket(data.ticket); setActivities(data.activities || []); }
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={showDelete}
        title="Delete Ticket"
        message={`Are you sure you want to delete ${ticket.ticketNumber}? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />
    </AnimatedPage>
  );
}
