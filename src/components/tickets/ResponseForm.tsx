import { useState } from 'react';
import { Send, Lock, UserCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTicketStore } from '../../store/ticketStore';
import { useAuthStore } from '../../store/authStore';
import { useAuth } from '../../hooks/useAuth';
import ImageUpload from '../ui/ImageUpload';

interface ResponseFormProps {
  ticketId: number;
  submitterEmail?: string;
  onSuccess?: () => void;
}

export default function ResponseForm({ ticketId, submitterEmail, onSuccess }: ResponseFormProps) {
  const { user, isAdmin } = useAuth();
  const users = useAuthStore((s) => s.users);
  const addResponse = useTicketStore((s) => s.addResponse);
  const [message, setMessage] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [respondAsUserId, setRespondAsUserId] = useState<string>('');

  const getRespondAsUser = () => {
    if (!isAdmin || !respondAsUserId) return null;
    return users.find((u) => u.id === Number(respondAsUserId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    const respondAs = getRespondAsUser();

    setLoading(true);
    try {
      addResponse({
        ticketId,
        userId: respondAs?.id ?? user?.id,
        userName: respondAs?.name ?? (user?.name || submitterEmail || 'Anonymous'),
        userRole: respondAs?.role ?? user?.role,
        message: message.trim(),
        images,
        isInternal: isAdmin ? isInternal : false,
      });

      // Detect @mentions and notify tagged users
      const mentions = message.match(/@(\w+)/g);
      if (mentions && !isInternal) {
        const mentionedNames = mentions.map((m) => m.slice(1).toLowerCase());
        const mentionedUsers = users.filter((u) =>
          mentionedNames.some(
            (name) =>
              u.name.toLowerCase().includes(name) ||
              u.username.toLowerCase() === name
          )
        );
        for (const mu of mentionedUsers) {
          toast(`Email sent to ${mu.name} (${mu.email}) — mentioned in response`, { icon: '📧', duration: 4000 });
        }
        if (mentionedUsers.length === 0 && mentions.length > 0) {
          toast(`Could not match ${mentions.join(', ')} to any user`, { icon: '⚠️' });
        }
      }

      if (!isInternal && (!mentions || mentions.length === 0)) {
        toast(`Email notification would be sent`, { icon: '📧' });
      }
      toast.success('Response added');
      setMessage('');
      setImages([]);
      setIsInternal(false);
      setRespondAsUserId('');
      onSuccess?.();
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {isAdmin && (
        <div>
          <label className="label flex items-center gap-2">
            <UserCircle size={16} className="text-amber-500" />
            Respond as
          </label>
          <select
            value={respondAsUserId}
            onChange={(e) => setRespondAsUserId(e.target.value)}
            className="input"
          >
            <option value="">Myself ({user?.name})</option>
            {users
              .filter((u) => u.id !== user?.id && !u.suspended)
              .map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email}) — {u.role}
                </option>
              ))}
          </select>
        </div>
      )}

      <div>
        <label className="label">Add Response</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your response..."
          className="textarea"
          rows={4}
          required
        />
      </div>

      <ImageUpload images={images} onChange={setImages} />

      {isAdmin && (
        <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
          <input
            type="checkbox"
            checked={isInternal}
            onChange={(e) => setIsInternal(e.target.checked)}
            className="rounded border-white/20 bg-white/[0.06] text-amber-500 focus:ring-amber-500"
          />
          <Lock size={14} className="text-amber-500" />
          Internal note (not visible to customer)
        </label>
      )}

      <div className="flex justify-center">
        <button type="submit" disabled={loading} className="btn btn-primary">
          <Send size={16} />
          {loading ? 'Sending...' : 'Send Response'}
        </button>
      </div>
    </form>
  );
}
