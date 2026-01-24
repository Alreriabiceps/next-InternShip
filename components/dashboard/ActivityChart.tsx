'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ActivityData {
  period?: string;
  week?: string;
  month?: string;
  count: number;
}

interface ActivityChartProps {
  data: ActivityData[];
  title: string;
  type: 'weekly' | 'monthly';
}

function formatMonth(monthStr: string): string {
  const [year, month] = monthStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

export default function ActivityChart({ data, title, type }: ActivityChartProps) {
  const chartData = data.map((item) => {
    const label = item.period ?? (type === 'weekly' ? item.week : item.month) ?? '';
    return {
      period: type === 'weekly'
        ? label.replace(/^Week\s+/i, 'W')
        : formatMonth(label),
      count: item.count,
    };
  });

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-gray-600 uppercase tracking-widest">{title}</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E5EA" />
          <XAxis 
            dataKey="period" 
            stroke="#8E8E93"
            style={{ fontSize: '11px' }}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis 
            stroke="#8E8E93"
            style={{ fontSize: '11px' }}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #E5E5EA',
              borderRadius: '12px',
              padding: '8px 12px',
            }}
          />
          <Bar 
            dataKey="count" 
            fill="#007AFF" 
            radius={[8, 8, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
