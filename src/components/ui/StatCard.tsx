import type { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  color?: string;
}

export default function StatCard({ label, value, icon: Icon, color = 'text-crane' }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass p-3 sm:p-5 relative"
    >
      <div className={`absolute top-2.5 right-2.5 sm:top-3 sm:right-3 ${color} opacity-40`}>
        <Icon size={14} />
      </div>
      <div>
        <p className="text-[10px] sm:text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1 truncate">{label}</p>
        <p className="text-xl sm:text-2xl font-bold text-white truncate">{value}</p>
      </div>
    </motion.div>
  );
}
