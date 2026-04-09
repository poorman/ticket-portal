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
      className="glass p-2 sm:p-5 relative"
    >
      <div className={`absolute top-1.5 right-1.5 sm:top-3 sm:right-3 ${color} opacity-40`}>
        <Icon size={12} className="sm:w-3.5 sm:h-3.5" />
      </div>
      <div>
        <p className="text-[8px] sm:text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-0.5 sm:mb-1 truncate">{label}</p>
        <p className="text-base sm:text-2xl font-bold text-white truncate">{value}</p>
      </div>
    </motion.div>
  );
}
