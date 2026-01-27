'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';

interface CompletionTrendData {
  date: string;
  rate: number;
}

interface CompletionTrendChartProps {
  data: CompletionTrendData[];
}

export default function CompletionTrendChart({ data }: CompletionTrendChartProps) {
  const chartData = data.map(item => ({
    date: format(parseISO(item.date), 'EEE'),
    fullDate: item.date,
    rate: item.rate,
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#007AFF" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#007AFF" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E5EA" vertical={false} />
        <XAxis 
          dataKey="date" 
          stroke="#8E8E93"
          style={{ fontSize: '11px' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis 
          stroke="#8E8E93"
          style={{ fontSize: '11px' }}
          axisLine={false}
          tickLine={false}
          domain={[0, 100]}
          ticks={[0, 50, 100]}
          tickFormatter={(value) => `${value}%`}
        />
        <Tooltip 
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #E5E5EA',
            borderRadius: '12px',
            padding: '8px 12px',
          }}
          formatter={(value: number) => [`${value}%`, 'Completion Rate']}
          labelFormatter={(label, payload) => {
            if (payload && payload[0]) {
              return format(parseISO(payload[0].payload.fullDate), 'EEEE, MMM d');
            }
            return label;
          }}
        />
        <Area 
          type="monotone" 
          dataKey="rate" 
          stroke="#007AFF" 
          strokeWidth={2}
          fillOpacity={1} 
          fill="url(#colorRate)" 
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
