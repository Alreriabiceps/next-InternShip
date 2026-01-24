'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface InternActivity {
  internId: string;
  internName: string;
  logCount: number;
  lastActivity: string;
}

interface InternActivityChartProps {
  data: InternActivity[];
}

export default function InternActivityChart({ data }: InternActivityChartProps) {
  const chartData = data.map(item => ({
    name: item.internName.length > 12 ? `${item.internName.substring(0, 12)}...` : item.internName,
    fullName: item.internName,
    logs: item.logCount,
  }));

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-gray-600 uppercase tracking-widest">Top Active Interns</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E5EA" />
          <XAxis 
            type="number"
            stroke="#8E8E93"
            style={{ fontSize: '11px' }}
          />
          <YAxis 
            dataKey="name" 
            type="category"
            stroke="#8E8E93"
            style={{ fontSize: '11px' }}
            width={100}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #E5E5EA',
              borderRadius: '12px',
              padding: '8px 12px',
            }}
            formatter={(value: number, name: string, props: any) => [
              `${value} logs`,
              props.payload.fullName
            ]}
          />
          <Bar 
            dataKey="logs" 
            fill="#007AFF" 
            radius={[0, 8, 8, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
