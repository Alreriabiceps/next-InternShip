'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface CompanyData {
  company: string;
  logCount: number;
  internCount: number;
}

interface CompanyBreakdownChartProps {
  data: CompanyData[];
}

const COLORS = ['#007AFF', '#34C759', '#FF9500', '#FF3B30', '#AF52DE', '#FF2D55', '#5AC8FA', '#FFCC00'];

export default function CompanyBreakdownChart({ data }: CompanyBreakdownChartProps) {
  const chartData = data.slice(0, 8).map(item => ({
    name: item.company.length > 15 ? `${item.company.substring(0, 15)}...` : item.company,
    value: item.logCount,
    fullName: item.company,
    internCount: item.internCount,
  }));

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-gray-600 uppercase tracking-widest">Company Breakdown</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #E5E5EA',
              borderRadius: '12px',
              padding: '8px 12px',
            }}
            formatter={(value: number, name: string, props: any) => [
              `${value} logs (${props.payload.internCount} interns)`,
              'Logs'
            ]}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="grid grid-cols-2 gap-2 mt-4">
        {chartData.map((item, index) => (
          <div key={index} className="flex items-center space-x-2 text-xs">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />
            <span className="text-gray-600 truncate">{item.fullName}</span>
            <span className="text-gray-400">({item.value})</span>
          </div>
        ))}
      </div>
    </div>
  );
}
