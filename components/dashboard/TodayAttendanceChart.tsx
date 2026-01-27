'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface TodayAttendanceChartProps {
  logged: number;
  notLogged: number;
}

export default function TodayAttendanceChart({ logged, notLogged }: TodayAttendanceChartProps) {
  const total = logged + notLogged;
  const data = [
    { name: 'Logged In', value: logged, color: '#34C759' },
    { name: 'Not Logged', value: notLogged, color: '#E5E5EA' },
  ];

  const percentage = total > 0 ? Math.round((logged / total) * 100) : 0;

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
            startAngle={90}
            endAngle={-270}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #E5E5EA',
              borderRadius: '12px',
              padding: '8px 12px',
            }}
            formatter={(value: number) => [`${value} interns`, '']}
          />
        </PieChart>
      </ResponsiveContainer>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-3xl font-bold text-gray-900">{percentage}%</span>
        <span className="text-xs text-gray-500">Attendance</span>
      </div>
      {/* Legend */}
      <div className="flex justify-center space-x-6 mt-2">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-sm text-gray-600">{logged} Logged</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-gray-200" />
          <span className="text-sm text-gray-600">{notLogged} Missing</span>
        </div>
      </div>
    </div>
  );
}
