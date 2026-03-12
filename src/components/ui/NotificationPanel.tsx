import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Check, CheckCheck, Trash2, Ticket, MessageSquare, RefreshCw, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotificationStore } from '../../store/notificationStore';
import type { Notification } from '../../store/notificationStore';
import { formatDate } from '../../lib/ticket-utils';

const typeIcons: Record<Notification['type'], typeof Ticket> = {
  ticket_created: Ticket,
  ticket_updated: RefreshCw,
  response_added: MessageSquare,
  ticket_closed: XCircle,
};

const typeColors: Record<Notification['type'], string> = {
  ticket_created: 'text-blue-400',
  ticket_updated: 'text-amber-400',
  response_added: 'text-emerald-400',
  ticket_closed: 'text-gray-400',
};

export default function NotificationPanel() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, markRead, markAllRead, clearAll } = useNotificationStore();
  const count = unreadCount();

  // Close on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06] transition-all cursor-pointer"
      >
        <Bell size={16} />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold bg-red-500 text-white rounded-full px-1">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-80 sm:w-96 glass-strong shadow-2xl shadow-black/40 overflow-hidden z-50"
            style={{ borderRadius: '0.5rem' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08]">
              <h3 className="text-sm font-semibold text-white">Notifications</h3>
              <div className="flex items-center gap-1">
                {count > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[11px] text-gray-500 hover:text-gray-300 px-2 py-1 rounded hover:bg-white/[0.06] transition-colors cursor-pointer"
                  >
                    <CheckCheck size={12} className="inline mr-1" />
                    Mark all read
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={clearAll}
                    className="text-[11px] text-gray-500 hover:text-red-400 px-2 py-1 rounded hover:bg-white/[0.06] transition-colors cursor-pointer"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-10 text-center">
                  <Bell size={24} className="mx-auto text-gray-600 mb-2" />
                  <p className="text-sm text-gray-500">No notifications yet</p>
                </div>
              ) : (
                notifications.map((n) => {
                  const Icon = typeIcons[n.type];
                  const color = typeColors[n.type];
                  return (
                    <div
                      key={n.id}
                      className={`flex items-start gap-3 px-4 py-3 border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors ${
                        !n.read ? 'bg-white/[0.02]' : ''
                      }`}
                    >
                      <div className={`p-1.5 rounded bg-white/[0.06] mt-0.5 shrink-0 ${color}`}>
                        <Icon size={12} />
                      </div>
                      <div className="flex-1 min-w-0">
                        {n.ticketId ? (
                          <Link
                            to={`/tickets/${n.ticketId}`}
                            onClick={() => { markRead(n.id); setOpen(false); }}
                            className="text-sm text-gray-300 hover:text-white no-underline block"
                          >
                            {n.ticketNumber && (
                              <span className="text-crane font-medium mr-1">{n.ticketNumber}</span>
                            )}
                            {n.message}
                          </Link>
                        ) : (
                          <p className="text-sm text-gray-300">
                            {n.message}
                          </p>
                        )}
                        <p className="text-[11px] text-gray-600 mt-0.5">{formatDate(n.createdAt)}</p>
                      </div>
                      {!n.read && (
                        <button
                          onClick={() => markRead(n.id)}
                          className="p-1 rounded text-gray-600 hover:text-gray-300 hover:bg-white/[0.06] transition-colors shrink-0 cursor-pointer"
                        >
                          <Check size={12} />
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
