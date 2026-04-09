import { useMemo, Fragment } from 'react';
import { Calendar, Clock, User } from 'lucide-react';
import StatusBadge from '../ui/StatusBadge';
import PriorityBadge from '../ui/PriorityBadge';
import TypeBadge from '../ui/TypeBadge';
import ImageGallery from '../ui/ImageGallery';
import ResponseTimeline from './ResponseTimeline';
import { formatDate } from '../../lib/ticket-utils';
import { useTicketStore } from '../../store/ticketStore';
import { useAuthStore } from '../../store/authStore';
import type { Ticket, TicketActivity } from '../../types';

interface TicketDetailsProps {
  ticket: Ticket;
  showInternalNotes?: boolean;
  activities?: TicketActivity[];
  sidebar?: React.ReactNode;
}

function ProfileIcon({ name, avatar, size = 'md' }: { name: string; avatar?: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base' };
  if (avatar) {
    return <img src={avatar} alt={name} className={`${sizeClasses[size]} rounded-full object-cover`} />;
  }
  return (
    <div className={`${sizeClasses[size]} rounded-full bg-white/[0.08] border border-white/[0.1] flex items-center justify-center shrink-0`}>
      <User size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} className="text-gray-400" />
    </div>
  );
}

export default function TicketDetails({ ticket, showInternalNotes = false, activities = [], sidebar }: TicketDetailsProps) {
  const allResponses = useTicketStore((s) => s.responses);
  const allUsers = useAuthStore((s) => s.users);
  const responses = useMemo(
    () => allResponses.filter((r) => r.ticketId === ticket.id && (showInternalNotes || !r.isInternal)),
    [allResponses, ticket.id, showInternalNotes]
  );

  const assigned = ticket.assignedTo?.filter(Boolean) ?? [];
  const cc = ticket.ccEmails?.filter(Boolean) ?? [];

  // Look up assigned user details
  const assignedUsers = assigned.map((username) => {
    const u = allUsers.find((u) => u.username === username);
    return { username, name: u?.name || username, avatar: u?.avatar };
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
      {/* LEFT — Main content */}
      <div className="min-w-0 space-y-6">
        {/* Ticket Header */}
        <div>
          <div className="flex flex-wrap items-baseline gap-3 mb-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">{ticket.ticketNumber}</h1>
            <h2 className="text-xl text-white/90 font-medium">{ticket.subject}</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
            <span className="text-xs text-gray-500">Type:</span>
            <TypeBadge type={ticket.type} />
          </div>
        </div>

        {/* Description Card */}
        <div className="card">
          <h3 className="text-sm font-semibold text-white/80 mb-3">Description</h3>
          <div className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
            <DescriptionWithEmbeds text={ticket.description} images={ticket.images} />
          </div>
          {/* Show non-inline images as attachments */}
          {ticket.images.length > 0 && !ticket.description.includes('{{img:') && (
            <div className="mt-4 pt-4 border-t border-white/[0.06]">
              <h4 className="text-xs font-medium text-gray-500 mb-2">Attachments</h4>
              <ImageGallery images={ticket.images} />
            </div>
          )}
        </div>

        {/* Timeline + Responses */}
        <div>
          <ResponseTimeline responses={responses} ticketCreatorId={ticket.userId} />
        </div>
      </div>

      {/* RIGHT — Sidebar with vertical separator line */}
      <div className="pt-2 lg:border-l lg:border-white/[0.06] lg:pl-6">
        {/* Created */}
        <div className="pb-4 mb-4 border-b border-white/[0.06]">
          <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Created</h4>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2 text-gray-300">
              <Calendar size={11} className="text-gray-500" />
              <span>{formatDate(ticket.createdAt)}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <Clock size={11} className="text-gray-500" />
              <span>{formatDate(ticket.updatedAt)}</span>
            </div>
          </div>
        </div>

        {/* Assigned */}
        {assignedUsers.length > 0 && (
          <div className="pb-4 mb-4 border-b border-white/[0.06]">
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Assigned</h4>
            <div className="space-y-2">
              {assignedUsers.map((u) => (
                <div key={u.username} className="flex items-center gap-2">
                  <ProfileIcon name={u.name} avatar={u.avatar} size="sm" />
                  <span className="text-sm text-white">{u.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Activity — first batch (top) */}
        {activities.length > 0 && (
          <div className="pb-4 mb-4 border-b border-white/[0.06]">
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Activity</h4>
            <div className="space-y-1.5">
              {activities.slice(0, 3).map((a) => (
                <div key={a.id} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{
                    backgroundColor: a.action === 'assigned' ? '#d4a574' :
                      a.action === 'status_changed' ? '#f59e0b' :
                      a.action === 'priority_changed' ? '#ef4444' :
                      '#6b7280'
                  }} />
                  <span className="text-xs text-gray-400 leading-relaxed">{a.detail}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CC — only show when no admin sidebar */}
        {cc.length > 0 && !sidebar && (
          <div className="pb-4 mb-4 border-b border-white/[0.06]">
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">CC</h4>
            <div className="flex flex-wrap gap-1.5">
              {cc.map((username) => (
                <span key={username} className="text-xs px-2 py-0.5 rounded-full bg-white/[0.06] text-gray-400">@{username}</span>
              ))}
            </div>
          </div>
        )}

        {/* Admin controls slot */}
        {sidebar}

        {/* Activity — remaining items (lower, aligned with responses) */}
        {activities.length > 3 && (
          <div className="pt-4 mt-4 border-t border-white/[0.06]">
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Activity</h4>
            <div className="space-y-1.5">
              {activities.slice(3).map((a) => (
                <div key={a.id} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{
                    backgroundColor: a.action === 'assigned' ? '#d4a574' :
                      a.action === 'status_changed' ? '#f59e0b' :
                      a.action === 'priority_changed' ? '#ef4444' :
                      '#6b7280'
                  }} />
                  <span className="text-xs text-gray-400 leading-relaxed">{a.detail}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export { ProfileIcon };

const EMBED_REGEX = /(?:https?:\/\/(?:www\.)?loom\.com\/share\/([a-zA-Z0-9]+)(?:\?[^\s]*)?)|(?:\{\{img:(\d+)\}\})/g;

function DescriptionWithEmbeds({ text, images = [] }: { text: string; images?: string[] }) {
  const parts: { type: 'text' | 'loom' | 'image'; value: string }[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  const regex = new RegExp(EMBED_REGEX);

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    }
    if (match[1]) {
      parts.push({ type: 'loom', value: match[1] });
    } else if (match[2]) {
      const idx = parseInt(match[2], 10) - 1;
      if (images[idx]) {
        parts.push({ type: 'image', value: images[idx] });
      }
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push({ type: 'text', value: text.slice(lastIndex) });
  }

  if (parts.every((p) => p.type === 'text')) {
    return <>{text}</>;
  }

  return (
    <>
      {parts.map((part, i) =>
        part.type === 'loom' ? (
          <div key={i} className="my-3 rounded-lg overflow-hidden" style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
            <iframe
              src={`https://www.loom.com/embed/${part.value}`}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
              frameBorder="0"
              allowFullScreen
              allow="autoplay; fullscreen"
            />
          </div>
        ) : part.type === 'image' ? (
          <div key={i} className="my-3">
            <img src={part.value} alt="Pasted image" className="max-w-full rounded-lg border border-white/[0.08]" />
          </div>
        ) : (
          <Fragment key={i}>{part.value}</Fragment>
        )
      )}
    </>
  );
}
