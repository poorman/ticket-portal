import { useState } from 'react';
import { Send, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTicketStore } from '../../store/ticketStore';
import { useAuth } from '../../hooks/useAuth';
import ImageUpload from '../ui/ImageUpload';

interface ResponseFormProps {
  ticketId: number;
  submitterEmail?: string;
  onSuccess?: () => void;
}

export default function ResponseForm({ ticketId, submitterEmail, onSuccess }: ResponseFormProps) {
  const { user, isAdmin } = useAuth();
  const addResponse = useTicketStore((s) => s.addResponse);
  const [message, setMessage] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    setLoading(true);
    try {
      addResponse({
        ticketId,
        userId: user?.id,
        userName: user?.name || submitterEmail || 'Anonymous',
        userRole: user?.role,
        message: message.trim(),
        images,
        isInternal: isAdmin ? isInternal : false,
      });

      if (!isInternal) {
        toast(`Email notification would be sent`, { icon: '📧' });
      }
      toast.success('Response added');
      setMessage('');
      setImages([]);
      setIsInternal(false);
      onSuccess?.();
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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

      <button type="submit" disabled={loading} className="btn btn-primary">
        <Send size={16} />
        {loading ? 'Sending...' : 'Send Response'}
      </button>
    </form>
  );
}
