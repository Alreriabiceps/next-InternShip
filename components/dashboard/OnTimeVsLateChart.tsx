'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface OnTimeVsLateChartProps {
  onTime: number;
  late: number;
}

export default function OnTimeVsLateChart({ onTime, late }: OnTimeVsLateChartProps) {
  const total = onTime + late;
  const onTimePercent = total > 0 ? Math.round((onTime / total) * 100) : 0;
  const latePercent = total > 0 ? Math.round((late / total) * 100) : 0;

  const data = [
    { name: 'On Time', value: onTime, percent: onTimePercent, color: '#34C759' },
    { name: 'Late', value: late, percent: latePercent, color: '#FF9500' },
  ];

  return (
    <div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 60, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E5EA" horizontal={false} />
          <XAxis type="number" stroke="#8E8E93" style={{ fontSize: '12px' }} />
          <YAxis type="category" dataKey="name" stroke="#8E8E93" style={{ fontSize: '12px' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #E5E5EA',
              borderRadius: '12px',
              padding: '8px 12px',
            }}
            formatter={(value: number, name: string, props: any) => [
              `${value} submissions (${props.payload.percent}%)`,
              ''
            ]}
          />
          <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={32}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {/* Stats below */}
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="text-center p-3 bg-green-50 rounded-xl">
          <div className="text-2xl font-bold text-green-600">{onTimePercent}%</div>
          <div className="text-xs text-gray-500">On Time</div>
        </div>
        <div className="text-center p-3 bg-amber-50 rounded-xl">
          <div className="text-2xl font-bold text-amber-600">{latePercent}%</div>
          <div className="text-xs text-gray-500">Late</div>
        </div>
      </div>
    </div>
  );
}
