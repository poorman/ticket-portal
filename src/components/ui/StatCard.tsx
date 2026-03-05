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
      className="glass p-5"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1">{label}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
        </div>
        <div className={`p-2.5 rounded-xl bg-white/[0.04] ${color}`}>
          <Icon size={20} />
        </div>
      </div>
    </motion.div>
  );
}
