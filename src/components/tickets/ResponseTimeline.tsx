import { motion } from 'framer-motion';
import { MessageSquare, Lock, User, Shield } from 'lucide-react';
import ImageGallery from '../ui/ImageGallery';
import { formatDate } from '../../lib/ticket-utils';
import type { TicketResponse } from '../../types';

export default function ResponseTimeline({ responses }: { responses: TicketResponse[] }) {
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
            className={`rounded-xl p-4 ${
              resp.isInternal
                ? 'bg-amber-500/[0.08] border border-amber-500/20'
                : 'bg-white/[0.03] border border-white/[0.06]'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-white">
                {resp.userName || 'Anonymous'}
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
              <span className="text-xs text-gray-500 ml-auto">
                {formatDate(resp.createdAt)}
              </span>
            </div>
            <p className="text-sm text-gray-300 whitespace-pre-wrap">{resp.message}</p>
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
