'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';

interface DailyTrend {
  date: string;
  count: number;
  complete: number;
}

interface DailyTrendsChartProps {
  data: DailyTrend[];
}

export default function DailyTrendsChart({ data }: DailyTrendsChartProps) {
  const chartData = data.map(item => ({
    date: format(parseISO(item.date), 'MMM d'),
    fullDate: item.date,
    'Total Logs': item.count,
    'Complete Logs': item.complete,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E5EA" />
        <XAxis 
          dataKey="date" 
          stroke="#8E8E93"
          style={{ fontSize: '12px' }}
        />
        <YAxis 
          stroke="#8E8E93"
          style={{ fontSize: '12px' }}
        />
        <Tooltip 
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #E5E5EA',
            borderRadius: '12px',
            padding: '8px 12px',
          }}
        />
        <Legend 
          wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}
        />
        <Line 
          type="monotone" 
          dataKey="Total Logs" 
          stroke="#007AFF" 
          strokeWidth={2}
          dot={{ fill: '#007AFF', r: 3 }}
          activeDot={{ r: 5 }}
        />
        <Line 
          type="monotone" 
          dataKey="Complete Logs" 
          stroke="#34C759" 
          strokeWidth={2}
          dot={{ fill: '#34C759', r: 3 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
