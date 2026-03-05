import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import type { Ticket } from '../../types';

const COLORS: Record<string, string> = {
  open: '#ef4444',
  in_progress: '#f59e0b',
  waiting_response: '#3b82f6',
  resolved: '#10b981',
  closed: '#6b7280',
};

const LABELS: Record<string, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  waiting_response: 'Waiting',
  resolved: 'Resolved',
  closed: 'Closed',
};

export default function StatusPieChart({ tickets }: { tickets: Ticket[] }) {
  const data = Object.entries(
    tickets.reduce<Record<string, number>>((acc, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    }, {})
  ).map(([status, count]) => ({
    name: LABELS[status] || status,
    value: count,
    color: COLORS[status] || '#6b7280',
  }));

  if (!data.length) return null;

  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={3}
          dataKey="value"
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            borderRadius: '12px',
            background: '#1a1a1f',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.3)',
            color: '#e5e7eb',
          }}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
