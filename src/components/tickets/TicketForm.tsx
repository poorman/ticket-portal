import { useState, useMemo } from 'react';
import { Send, X, UserCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';
import { useTicketStore } from '../../store/ticketStore';
import { useAuthStore } from '../../store/authStore';
import { usePortalStore } from '../../store/portalStore';
import { useAuth } from '../../hooks/useAuth';
import ImageUpload from '../ui/ImageUpload';
import { handleRichPaste } from '../../lib/paste-utils';
import type { TicketType, TicketPriority } from '../../types';

const DEFAULT_ASSIGNED_USERNAMES = ['oggie', 'rana'];
const DEFAULT_CC_USERNAMES = ['kristina', 'robin', 'peter', 'bj', 'rose'];

interface TicketFormProps {
  onSuccess?: (ticketNumber: string) => void;
}

export default function TicketForm({ onSuccess }: TicketFormProps) {
  const { user, isLoggedIn, isAdmin } = useAuth();
  const createTicket = useTicketStore((s) => s.createTicket);
  const allUsers = useAuthStore((s) => s.users);
  const activePortal = usePortalStore((s) => s.activePortal);
  const [loading, setLoading] = useState(false);
  const [linkToAccount, setLinkToAccount] = useState(true);
  const [images, setImages] = useState<string[]>([]);
  const [assignedTo, setAssignedTo] = useState<string[]>(DEFAULT_ASSIGNED_USERNAMES);
  const [ccEmails, setCcEmails] = useState<string[]>(DEFAULT_CC_USERNAMES);
  const [submitAsUserId, setSubmitAsUserId] = useState<string>('');

  const availableUsers = useMemo(
    () => allUsers.filter((u) => !u.suspended && u.username).map((u) => ({ username: u.username!, name: u.name, email: u.email })),
    [allUsers]
  );

  const validUsernames = useMemo(() => new Set(availableUsers.map((u) => u.username)), [availableUsers]);

  const [form, setForm] = useState({
    type: 'general' as TicketType,
    subject: '',
    description: '',
    submitterName: user?.name || '',
    submitterEmail: user?.email || '',
    submitterPhone: '',
    priority: 'medium' as TicketPriority,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.subject.length < 5) {
      toast.error('Subject must be at least 5 characters');
      return;
    }
    if (form.description.length < 10) {
      toast.error('Description must be at least 10 characters');
      return;
    }

    setLoading(true);
    try {
      const submitAsUser = isAdmin && submitAsUserId
        ? allUsers.find((u) => u.id === Number(submitAsUserId))
        : null;

      const submitData = submitAsUser
        ? { ...form, submitterName: submitAsUser.name, submitterEmail: submitAsUser.email, submitterPhone: submitAsUser.phone || form.submitterPhone }
        : isLoggedIn
          ? { ...form, submitterName: user!.name, submitterEmail: user!.email, submitterPhone: user!.phone || form.submitterPhone }
          : form;
      const ticket = await createTicket({
        ...submitData,
        userId: submitAsUser ? submitAsUser.id : (isLoggedIn && linkToAccount ? user!.id : undefined),
        assignedTo: assignedTo.filter((u) => u && validUsernames.has(u)),
        ccEmails: ccEmails.filter((u) => u && validUsernames.has(u)),
        images,
        portal: activePortal,
      });

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#d4a574', '#b8935f', '#e8c49f', '#f5e6d3'],
      });

      toast.success(`Ticket ${ticket.ticketNumber} created!`);
      toast(`Email notification would be sent to ${form.submitterEmail}`, { icon: '📧' });
      onSuccess?.(ticket.ticketNumber);
    } finally {
      setLoading(false);
    }
  };

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {isAdmin && (
        <div>
          <label className="label flex items-center gap-2">
            <UserCircle size={16} className="text-amber-500" />
            Submit as user
          </label>
          <select
            value={submitAsUserId}
            onChange={(e) => setSubmitAsUserId(e.target.value)}
            className="input"
          >
            <option value="">Myself ({user?.username || user?.name})</option>
            {allUsers
              .filter((u) => u.id !== user?.id && !u.suspended)
              .map((u) => (
                <option key={u.id} value={u.id}>
                  {u.username || u.name}
                </option>
              ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Ticket Type</label>
          <select
            value={form.type}
            onChange={(e) => update('type', e.target.value)}
            className="select"
          >
            <option value="general">General Inquiry</option>
            <option value="support">Support Request</option>
            <option value="bug">Bug Report</option>
            <option value="feature_request">Feature Request</option>
          </select>
        </div>
        <div>
          <label className="label">Priority</label>
          <select
            value={form.priority}
            onChange={(e) => update('priority', e.target.value)}
            className="select"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>

      <div>
        <label className="label">Subject</label>
        <input
          type="text"
          value={form.subject}
          onChange={(e) => update('subject', e.target.value)}
          placeholder="Brief description of your issue"
          className="input"
          required
          minLength={5}
        />
      </div>

      <div>
        <label className="label">Description</label>
        <textarea
          id="ticket-description"
          value={form.description}
          onChange={(e) => update('description', e.target.value)}
          onPaste={async (e) => {
            const result = await handleRichPaste(e, images);
            if (result) {
              const ta = document.getElementById('ticket-description') as HTMLTextAreaElement;
              const pos = ta?.selectionStart ?? form.description.length;
              const before = form.description.slice(0, pos);
              const after = form.description.slice(pos);
              update('description', before + result.text + after);
              setImages(result.images);
            }
          }}
          placeholder="Please provide details about your issue... (paste images with Ctrl+V)"
          className="textarea"
          rows={5}
          required
          minLength={10}
        />
        {images.length > 0 && (
          <p className="text-xs text-gray-500 mt-1">{images.length} image{images.length > 1 ? 's' : ''} pasted inline</p>
        )}
      </div>

      {!isLoggedIn && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Your Name</label>
              <input
                type="text"
                value={form.submitterName}
                onChange={(e) => update('submitterName', e.target.value)}
                placeholder="John Doe"
                className="input"
                required
                minLength={2}
              />
            </div>
            <div>
              <label className="label">Your Email</label>
              <input
                type="email"
                value={form.submitterEmail}
                onChange={(e) => update('submitterEmail', e.target.value)}
                placeholder="john@example.com"
                className="input"
                required
              />
            </div>
          </div>

          <div>
            <label className="label">Phone (optional)</label>
            <input
              type="tel"
              value={form.submitterPhone}
              onChange={(e) => update('submitterPhone', e.target.value)}
              placeholder="+1 (555) 000-0000"
              className="input"
            />
          </div>
        </>
      )}

      {/* Assigned To */}
      <div>
        <label className="label">Assigned To</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {assignedTo.filter((un) => un && validUsernames.has(un)).map((username) => (
              <span key={username} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-crane/20 text-crane">
                @{username}
                <button type="button" onClick={() => setAssignedTo((prev) => prev.filter((a) => a !== username))} className="hover:text-white cursor-pointer">
                  <X size={12} />
                </button>
              </span>
          ))}
        </div>
        <select
          className="select"
          value=""
          onChange={(e) => {
            const v = e.target.value;
            if (v && !assignedTo.includes(v)) setAssignedTo([...assignedTo, v]);
          }}
        >
          <option value="">Add person...</option>
          {availableUsers
            .filter((u) => !assignedTo.includes(u.username))
            .map((u) => (
              <option key={u.username} value={u.username}>
                @{u.username}
              </option>
            ))}
        </select>
      </div>

      {/* CC */}
      <div>
        <label className="label">CC</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {ccEmails.filter((un) => un && validUsernames.has(un)).map((username) => (
              <span key={username} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-white/[0.06] text-gray-300">
                @{username}
                <button type="button" onClick={() => setCcEmails((prev) => prev.filter((c) => c !== username))} className="hover:text-white cursor-pointer">
                  <X size={12} />
                </button>
              </span>
          ))}
        </div>
        <select
          className="select"
          value=""
          onChange={(e) => {
            const v = e.target.value;
            if (v && !ccEmails.includes(v)) setCcEmails([...ccEmails, v]);
          }}
        >
          <option value="">Add person...</option>
          {availableUsers
            .filter((u) => !ccEmails.includes(u.username))
            .map((u) => (
              <option key={u.username} value={u.username}>
                @{u.username}
              </option>
            ))}
        </select>
      </div>

      <div>
        <label className="label">Attachments</label>
        <ImageUpload images={images} onChange={setImages} />
      </div>

      {isLoggedIn && (
        <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
          <input
            type="checkbox"
            checked={linkToAccount}
            onChange={(e) => setLinkToAccount(e.target.checked)}
            className="rounded border-white/20 bg-white/[0.06] text-crane focus:ring-crane"
          />
          Link this ticket to my account ({user?.email})
        </label>
      )}

      <button type="submit" disabled={loading} className="btn btn-primary btn-lg w-full">
        <Send size={18} />
        {loading ? 'Submitting...' : 'Submit Ticket'}
      </button>
    </form>
  );
}
