import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { Ticket } from '../../types';

export default function TicketsOverTimeChart({ tickets }: { tickets: Ticket[] }) {
  const days = 30;
  const now = new Date();
  const data = Array.from({ length: days }, (_, i) => {
    const date = new Date(now);
    date.setDate(date.getDate() - (days - 1 - i));
    const dateStr = date.toISOString().split('T')[0];
    const count = tickets.filter((t) => t.createdAt.startsWith(dateStr)).length;
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      tickets: count,
    };
  });

  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12, fill: '#9ca3af' }}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 12, fill: '#9ca3af' }}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
          }}
        />
        <Line
          type="monotone"
          dataKey="tickets"
          stroke="#d4a574"
          strokeWidth={2}
          dot={{ fill: '#d4a574', r: 3 }}
          activeDot={{ r: 5, fill: '#b8935f' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
