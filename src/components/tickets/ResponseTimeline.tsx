import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Lock, User, Shield, X, Mail, Phone, Clock, AtSign } from 'lucide-react';
import ImageGallery from '../ui/ImageGallery';
import { formatDate } from '../../lib/ticket-utils';
import { useTicketStore } from '../../store/ticketStore';
import { useAuthStore } from '../../store/authStore';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import type { TicketResponse } from '../../types';

function UserPopover({ userId, userName, onClose }: { userId?: number; userName?: string; onClose: () => void }) {
  const users = useAuthStore((s) => s.users);
  const ref = useRef<HTMLDivElement>(null);

  const user = userId
    ? users.find((u) => u.id === userId)
    : users.find((u) => u.name === userName);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: -4, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -4, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className="absolute left-0 top-full mt-1 z-50 w-64 rounded-lg border border-white/[0.08] bg-[#1a1a1f]/95 backdrop-blur-xl shadow-2xl p-4"
    >
      {user ? (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/[0.06] flex items-center justify-center shrink-0">
              {user.role === 'admin' ? (
                <Shield size={18} className="text-crane" />
              ) : (
                <User size={18} className="text-gray-400" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.name}</p>
              <p className="text-xs text-crane/70">@{user.username}</p>
            </div>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center gap-2 text-gray-400">
              <Mail size={12} className="text-gray-500 shrink-0" />
              <span className="truncate">{user.email}</span>
            </div>
            {user.phone && (
              <div className="flex items-center gap-2 text-gray-400">
                <Phone size={12} className="text-gray-500 shrink-0" />
                <span>{user.phone}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-gray-400">
              <AtSign size={12} className="text-gray-500 shrink-0" />
              <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                user.role === 'admin' ? 'bg-crane/20 text-crane' : 'bg-white/[0.06] text-gray-400'
              }`}>
                {user.role}
              </span>
              {user.suspended && (
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-500/20 text-red-400">suspended</span>
              )}
            </div>
            {user.lastLoginAt && (
              <div className="flex items-center gap-2 text-gray-500">
                <Clock size={12} className="shrink-0" />
                <span>Last seen {formatDate(user.lastLoginAt)}</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-2">
          <p className="text-sm text-white font-medium">{userName || 'Anonymous'}</p>
          <p className="text-xs text-gray-500 mt-1">Guest user — no account</p>
        </div>
      )}
    </motion.div>
  );
}

export default function ResponseTimeline({ responses, ticketCreatorId }: { responses: TicketResponse[]; ticketCreatorId?: number }) {
  const { isAdmin } = useAuth();
  const deleteResponse = useTicketStore((s) => s.deleteResponse);
  const [openPopover, setOpenPopover] = useState<number | null>(null);

  if (!responses.length) {
    return (
      <p className="text-sm text-gray-500 text-center py-8">No responses yet</p>
    );
  }

  return (
    <div className="space-y-4">
      {responses.map((resp, i) => (
        <motion.div
          key={resp.id}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          className="relative pl-8"
        >
          <div className="absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center bg-white/[0.06]">
            {resp.isInternal ? (
              <Lock size={12} className="text-amber-500" />
            ) : (
              <MessageSquare size={12} className="text-gray-500" />
            )}
          </div>

          <div
            className={`rounded p-4 ${
              resp.isInternal
                ? 'bg-amber-500/[0.08] border border-amber-500/20'
                : ticketCreatorId && resp.userId === ticketCreatorId
                  ? 'bg-crane/[0.04] border border-crane/15'
                  : 'bg-white/[0.03] border border-white/[0.06]'
            }`}
          >
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2">
              <span className="relative">
                <button
                  onClick={() => setOpenPopover(openPopover === resp.id ? null : resp.id)}
                  className="text-sm font-medium text-white hover:text-crane transition-colors cursor-pointer"
                >
                  {resp.userName || 'Anonymous'}
                </button>
                <AnimatePresence>
                  {openPopover === resp.id && (
                    <UserPopover
                      userId={resp.userId}
                      userName={resp.userName}
                      onClose={() => setOpenPopover(null)}
                    />
                  )}
                </AnimatePresence>
              </span>
              {resp.userRole === 'admin' ? (
                <span className="badge bg-crane/20 text-crane">
                  <Shield size={10} className="mr-1" /> Admin
                </span>
              ) : (
                <span className="badge bg-white/[0.06] text-gray-400">
                  <User size={10} className="mr-1" /> User
                </span>
              )}
              {resp.isInternal && (
                <span className="badge bg-amber-500/15 text-amber-400">
                  <Lock size={10} className="mr-1" /> Internal
                </span>
              )}
              <span className="text-xs text-gray-500 ml-auto shrink-0">
                {formatDate(resp.createdAt)}
              </span>
              {isAdmin && (
                <button
                  onClick={() => {
                    deleteResponse(resp.id);
                    toast.success('Response deleted');
                  }}
                  className="p-1 rounded hover:bg-white/10 text-gray-500 hover:text-red-400 transition-colors shrink-0"
                  title="Delete response"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <p className="text-sm text-gray-300 whitespace-pre-wrap">
              {resp.message.split(/(@\w+)/g).map((part, idx) =>
                part.match(/^@\w+$/) ? (
                  <span key={idx} className="text-amber-400 font-medium">{part}</span>
                ) : (
                  part
                )
              )}
            </p>
            {resp.images.length > 0 && (
              <div className="mt-3">
                <ImageGallery images={resp.images} />
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
