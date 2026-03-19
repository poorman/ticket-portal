import { useState, useRef, useCallback, useEffect } from 'react';
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

  // @mention autocomplete state
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionIndex, setMentionIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mentionListRef = useRef<HTMLDivElement>(null);

  const activeUsers = users.filter((u) => !u.suspended);

  const mentionResults = mentionQuery !== null
    ? activeUsers.filter((u) => {
        const q = mentionQuery.toLowerCase();
        return u.username.toLowerCase().includes(q) || u.name.toLowerCase().includes(q);
      }).slice(0, 6)
    : [];

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setMessage(val);

    const pos = e.target.selectionStart;
    const textBefore = val.slice(0, pos);
    const match = textBefore.match(/@(\w*)$/);
    if (match) {
      setMentionQuery(match[1]);
      setMentionIndex(0);
    } else {
      setMentionQuery(null);
    }
  }, []);

  const insertMention = useCallback((username: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const pos = textarea.selectionStart;
    const textBefore = message.slice(0, pos);
    const textAfter = message.slice(pos);
    const atPos = textBefore.lastIndexOf('@');
    const newText = textBefore.slice(0, atPos) + '@' + username + ' ' + textAfter;
    setMessage(newText);
    setMentionQuery(null);

    // Restore focus and cursor position
    requestAnimationFrame(() => {
      textarea.focus();
      const newPos = atPos + username.length + 2;
      textarea.setSelectionRange(newPos, newPos);
    });
  }, [message]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (mentionQuery === null || mentionResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setMentionIndex((prev) => (prev + 1) % mentionResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setMentionIndex((prev) => (prev - 1 + mentionResults.length) % mentionResults.length);
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      insertMention(mentionResults[mentionIndex].username);
    } else if (e.key === 'Escape') {
      setMentionQuery(null);
    }
  }, [mentionQuery, mentionResults, mentionIndex, insertMention]);

  // Scroll active item into view
  useEffect(() => {
    if (mentionListRef.current) {
      const active = mentionListRef.current.children[mentionIndex] as HTMLElement;
      if (active) active.scrollIntoView({ block: 'nearest' });
    }
  }, [mentionIndex]);

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
      setMentionQuery(null);
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
            <option value="">Myself ({user?.username || user?.name})</option>
            {users
              .filter((u) => u.id !== user?.id && !u.suspended)
              .map((u) => (
                <option key={u.id} value={u.id}>
                  {u.username || u.name}
                </option>
              ))}
          </select>
        </div>
      )}

      <div className="relative">
        <label className="label">Add Response</label>
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder="Type your response... Use @ to mention users"
          className="textarea"
          rows={4}
          required
        />

        {/* @mention autocomplete dropdown */}
        {mentionQuery !== null && mentionResults.length > 0 && (
          <div
            ref={mentionListRef}
            className="absolute left-0 right-0 bottom-full mb-1 z-50 max-h-48 overflow-y-auto rounded-lg border border-white/[0.08] bg-[#1a1a1f]/95 backdrop-blur-xl shadow-2xl py-1"
          >
            {mentionResults.map((u, idx) => (
              <button
                key={u.id}
                type="button"
                className={`w-full flex items-center gap-3 px-3 py-2 text-left text-sm transition-colors ${
                  idx === mentionIndex
                    ? 'bg-crane/10 text-white'
                    : 'text-gray-300 hover:bg-white/[0.04]'
                }`}
                onMouseDown={(e) => {
                  e.preventDefault(); // prevent textarea blur
                  insertMention(u.username);
                }}
                onMouseEnter={() => setMentionIndex(idx)}
              >
                <div className="w-7 h-7 rounded-full bg-white/[0.06] flex items-center justify-center shrink-0 text-xs font-medium text-crane">
                  {u.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-medium truncate">{u.name}</p>
                  <p className="text-xs text-gray-500 truncate">@{u.username}</p>
                </div>
              </button>
            ))}
          </div>
        )}
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
