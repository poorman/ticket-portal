import { useState } from 'react';
import { Send } from 'lucide-react';
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';
import { useTicketStore } from '../../store/ticketStore';
import { useAuth } from '../../hooks/useAuth';
import ImageUpload from '../ui/ImageUpload';
import type { TicketType, TicketPriority } from '../../types';

interface TicketFormProps {
  onSuccess?: (ticketNumber: string) => void;
}

export default function TicketForm({ onSuccess }: TicketFormProps) {
  const { user, isLoggedIn } = useAuth();
  const createTicket = useTicketStore((s) => s.createTicket);
  const [loading, setLoading] = useState(false);
  const [linkToAccount, setLinkToAccount] = useState(true);
  const [images, setImages] = useState<string[]>([]);
  const [form, setForm] = useState({
    type: 'general' as TicketType,
    subject: '',
    description: '',
    submitterName: user?.name || '',
    submitterEmail: user?.email || '',
    submitterPhone: '',
    priority: 'medium' as TicketPriority,
  });

  const handleSubmit = (e: React.FormEvent) => {
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
      const ticket = createTicket({
        ...form,
        userId: isLoggedIn && linkToAccount ? user!.id : undefined,
        images,
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
          value={form.description}
          onChange={(e) => update('description', e.target.value)}
          placeholder="Please provide details about your issue..."
          className="textarea"
          rows={5}
          required
          minLength={10}
        />
      </div>

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

      <div>
        <label className="label">Attachments</label>
        <ImageUpload images={images} onChange={setImages} />
      </div>

      {isLoggedIn && (
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={linkToAccount}
            onChange={(e) => setLinkToAccount(e.target.checked)}
            className="rounded border-gray-300 text-crane focus:ring-crane"
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
