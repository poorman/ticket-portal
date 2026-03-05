import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, XCircle, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import AnimatedPage from '../components/layout/AnimatedPage';
import TicketDetails from '../components/tickets/TicketDetails';
import ResponseForm from '../components/tickets/ResponseForm';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { useTicketStore } from '../store/ticketStore';
import type { Ticket, TicketStatus, TicketPriority } from '../types';

export default function AdminTicketDetailPage() {
  const user = useRequireAuth(true);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getTicketById, updateTicket, deleteTicket } = useTicketStore();
  const [ticket, setTicket] = useState<Ticket | undefined>(undefined);
  const [status, setStatus] = useState<TicketStatus>('open');
  const [priority, setPriority] = useState<TicketPriority>('medium');
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    const t = getTicketById(Number(id));
    if (t) {
      setTicket(t);
      setStatus(t.status);
      setPriority(t.priority);
    }
  }, [id, getTicketById]);

  const refreshTicket = () => {
    const t = getTicketById(Number(id));
    if (t) {
      setTicket({ ...t });
      setStatus(t.status);
      setPriority(t.priority);
    }
  };

  const handleUpdate = () => {
    if (!ticket) return;
    updateTicket(ticket.id, { status, priority });
    toast.success('Ticket updated');
    refreshTicket();
  };

  const handleClose = () => {
    if (!ticket) return;
    updateTicket(ticket.id, { status: 'closed' });
    toast.success('Ticket closed');
    refreshTicket();
  };

  const handleDelete = () => {
    if (!ticket) return;
    deleteTicket(ticket.id);
    toast.success('Ticket deleted');
    navigate('/admin');
  };

  if (!user) return null;

  if (!ticket) {
    return (
      <AnimatedPage>
        <div className="max-w-3xl mx-auto px-4 py-8 text-center">
          <p className="text-gray-500">Ticket not found.</p>
          <Link to="/admin" className="text-sm text-crane-dark hover:text-crane mt-2 inline-block">
            Back to admin
          </Link>
        </div>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <Link to="/admin" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6 no-underline">
          <ArrowLeft size={14} />
          Back to admin
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            <TicketDetails ticket={ticket} showInternalNotes />

            <div className="card">
              <ResponseForm
                ticketId={ticket.id}
                onSuccess={refreshTicket}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="card">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">
                Admin Controls
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="label">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as TicketStatus)}
                    className="select"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="waiting_response">Waiting Response</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                <div>
                  <label className="label">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TicketPriority)}
                    className="select"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <button onClick={handleUpdate} className="btn btn-primary w-full">
                  <Save size={16} />
                  Update Ticket
                </button>

                {ticket.status !== 'closed' && (
                  <button onClick={handleClose} className="btn btn-secondary w-full">
                    <XCircle size={16} />
                    Close Ticket
                  </button>
                )}

                <div className="border-t border-gray-200 pt-4">
                  <button
                    onClick={() => setShowDelete(true)}
                    className="btn btn-danger w-full"
                  >
                    <Trash2 size={16} />
                    Delete Ticket
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
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
