import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, XCircle, Trash2, X, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';
import AnimatedPage from '../components/layout/AnimatedPage';
import TicketDetails from '../components/tickets/TicketDetails';
import ResponseForm from '../components/tickets/ResponseForm';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { useTicketStore } from '../store/ticketStore';
import { useAuthStore } from '../store/authStore';
import { useReadStore } from '../store/readStore';
import type { Ticket, TicketActivity, TicketStatus, TicketPriority } from '../types';

export default function AdminTicketDetailPage() {
  const user = useRequireAuth(true);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const fetchTicketDetail = useTicketStore((s) => s.fetchTicketDetail);
  const updateTicket = useTicketStore((s) => s.updateTicket);
  const deleteTicket = useTicketStore((s) => s.deleteTicket);
  const resolveTicket = useTicketStore((s) => s.resolveTicket);
  const markSeen = useReadStore((s) => s.markSeen);
  const allUsers = useAuthStore((s) => s.users);
  const [ticket, setTicket] = useState<Ticket | undefined>(undefined);
  const [activities, setActivities] = useState<TicketActivity[]>([]);
  const [status, setStatus] = useState<TicketStatus>('open');
  const [priority, setPriority] = useState<TicketPriority>('medium');
  const [assignedTo, setAssignedTo] = useState<string[]>([]);
  const [ccEmails, setCcEmails] = useState<string[]>([]);
  const [editing, setEditing] = useState(false);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [createdAt, setCreatedAt] = useState('');
  const [showDelete, setShowDelete] = useState(false);

  const availableUsers = useMemo(
    () => allUsers.filter((u) => !u.suspended && u.username).map((u) => ({ username: u.username!, name: u.name })),
    [allUsers]
  );
  const validUsernames = useMemo(() => new Set(availableUsers.map((u) => u.username)), [availableUsers]);

  useEffect(() => {
    fetchTicketDetail(Number(id)).then((data) => {
      if (data) {
        setTicket(data.ticket);
        setActivities(data.activities || []);
        setStatus(data.ticket.status);
        setPriority(data.ticket.priority);
        setSubject(data.ticket.subject);
        setDescription(data.ticket.description);
        setAssignedTo(data.ticket.assignedTo ?? []);
        setCcEmails(data.ticket.ccEmails ?? []);
        setCreatedAt(data.ticket.createdAt);
        markSeen(data.ticket.id, data.responses.length);
      }
    });
  }, [id, fetchTicketDetail, markSeen]);

  const refreshTicket = async () => {
    const data = await fetchTicketDetail(Number(id));
    if (data) {
      setTicket(data.ticket);
      setActivities(data.activities || []);
      setStatus(data.ticket.status);
      setPriority(data.ticket.priority);
      setSubject(data.ticket.subject);
      setDescription(data.ticket.description);
      setAssignedTo(data.ticket.assignedTo ?? []);
      setCcEmails(data.ticket.ccEmails ?? []);
      setCreatedAt(data.ticket.createdAt);
    }
  };

  const handleUpdate = async () => {
    if (!ticket) return;
    await updateTicket(ticket.id, { status, priority, subject, description, assignedTo, ccEmails, createdAt });
    toast.success('Ticket updated');
    setEditing(false);
    await refreshTicket();
  };

  const handleClose = async () => {
    if (!ticket) return;
    await resolveTicket(ticket.id);
    toast.success('Ticket resolved');
    await refreshTicket();
  };

  const handleDelete = async () => {
    if (!ticket) return;
    await deleteTicket(ticket.id);
    toast.success('Ticket deleted');
    navigate('/admin');
  };

  if (!user) return null;

  if (!ticket) {
    return (
      <AnimatedPage>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 text-center">
          <p className="text-gray-500">Ticket not found.</p>
          <Link to="/admin" className="text-sm text-crane hover:text-crane-light mt-2 inline-block">Back to admin</Link>
        </div>
      </AnimatedPage>
    );
  }

  const adminSidebar = (
    <div className="card !p-4 space-y-4">
      <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Admin Controls</h4>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label !text-[11px]">Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value as TicketStatus)} className="select !text-xs !py-1.5">
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="waiting_response">Waiting Response</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
        <div>
          <label className="label !text-[11px]">Priority</label>
          <select value={priority} onChange={(e) => setPriority(e.target.value as TicketPriority)} className="select !text-xs !py-1.5">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>

      {/* Assigned To */}
      <div>
        <label className="label !text-[11px]">Assigned To</label>
        <div className="flex flex-wrap gap-1.5 mb-1.5">
          {assignedTo.filter((un) => un && validUsernames.has(un)).map((username) => (
            <span key={username} className="inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded-full bg-crane/20 text-crane">
              @{username}
              <button type="button" onClick={() => setAssignedTo((prev) => prev.filter((a) => a !== username))} className="hover:text-white cursor-pointer"><X size={10} /></button>
            </span>
          ))}
        </div>
        <select className="select !text-xs !py-1.5" value="" onChange={(e) => { const v = e.target.value; if (v && !assignedTo.includes(v)) setAssignedTo([...assignedTo, v]); }}>
          <option value="">Add person...</option>
          {availableUsers.filter((u) => !assignedTo.includes(u.username)).map((u) => (<option key={u.username} value={u.username}>@{u.username}</option>))}
        </select>
      </div>

      {/* CC */}
      <div>
        <label className="label !text-[11px]">CC</label>
        <div className="flex flex-wrap gap-1.5 mb-1.5">
          {ccEmails.filter((un) => un && validUsernames.has(un)).map((username) => (
            <span key={username} className="inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded-full bg-white/[0.06] text-gray-300">
              @{username}
              <button type="button" onClick={() => setCcEmails((prev) => prev.filter((c) => c !== username))} className="hover:text-white cursor-pointer"><X size={10} /></button>
            </span>
          ))}
        </div>
        <select className="select !text-xs !py-1.5" value="" onChange={(e) => { const v = e.target.value; if (v && !ccEmails.includes(v)) setCcEmails([...ccEmails, v]); }}>
          <option value="">Add person...</option>
          {availableUsers.filter((u) => !ccEmails.includes(u.username)).map((u) => (<option key={u.username} value={u.username}>@{u.username}</option>))}
        </select>
      </div>

      <div className="space-y-2 pt-2">
        <button onClick={handleUpdate} className="btn btn-primary w-full !py-2 !text-sm">
          <Save size={14} /> Update Ticket
        </button>
        {ticket.status !== 'resolved' && (
          <button onClick={handleClose} className="btn btn-secondary w-full !py-2 !text-sm">
            <XCircle size={14} /> Resolve Ticket
          </button>
        )}
        <button onClick={() => setShowDelete(true)} className="btn btn-danger w-full !py-2 !text-sm">
          <Trash2 size={14} /> Delete Ticket
        </button>
      </div>
    </div>
  );

  return (
    <AnimatedPage>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/[0.06]">
          <Link to="/admin" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-300 no-underline">
            <ArrowLeft size={14} /> Back to admin
          </Link>
          {!editing && (
            <button onClick={() => setEditing(true)} className="btn btn-sm bg-white/[0.06] text-gray-300 hover:text-white cursor-pointer">
              <Pencil size={13} /> Edit
            </button>
          )}
        </div>

        {editing ? (
          <div className="card space-y-4 mb-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Edit Ticket</h3>
              <button onClick={() => { setEditing(false); setSubject(ticket.subject); setDescription(ticket.description); }} className="text-xs text-gray-500 hover:text-white cursor-pointer">Cancel</button>
            </div>
            <div>
              <label className="label">Subject</label>
              <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} className="input" />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={6} className="input" />
            </div>
            <div>
              <label className="label">Created Date</label>
              <input
                type="datetime-local"
                value={createdAt ? createdAt.slice(0, 16) : ''}
                onChange={(e) => setCreatedAt(e.target.value ? new Date(e.target.value).toISOString() : createdAt)}
                className="input"
              />
            </div>
            <button onClick={handleUpdate} className="btn btn-primary">
              <Save size={16} /> Save Changes
            </button>
          </div>
        ) : (
          <TicketDetails ticket={ticket} showInternalNotes activities={activities} sidebar={adminSidebar} />
        )}

        {/* Response form below the grid */}
        {!editing && (
          <div className="mt-6 lg:max-w-[calc(100%-320px-1.5rem)]">
            <div className="card">
              <ResponseForm ticketId={ticket.id} onSuccess={refreshTicket} />
            </div>
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
