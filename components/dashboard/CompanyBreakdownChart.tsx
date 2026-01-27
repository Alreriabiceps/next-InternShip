'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface CompanyData {
  company: string;
  logCount: number;
  internCount: number;
}

interface CompanyBreakdownChartProps {
  data: CompanyData[];
}

const COLORS = [
  '#007AFF', '#34C759', '#FF9500', '#FF3B30', '#AF52DE', 
  '#FF2D55', '#5AC8FA', '#FFCC00', '#00C7BE', '#32ADE6',
  '#BF5AF2', '#FF6482', '#64D2FF', '#FFD60A', '#30D158',
  '#8E8E93', '#636366', '#48484A', '#3A3A3C', '#2C2C2E'
];

export default function CompanyBreakdownChart({ data }: CompanyBreakdownChartProps) {
  // Show all companies - use intern count as the value for pie chart
  const chartData = data.map((item, index) => ({
    name: item.company.length > 18 ? `${item.company.substring(0, 18)}...` : item.company,
    value: item.internCount,
    fullName: item.company,
    internCount: item.internCount,
    logCount: item.logCount,
    color: COLORS[index % COLORS.length],
  }));

  const totalInterns = chartData.reduce((sum, c) => sum + c.value, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-600 uppercase tracking-widest">
          Interns by Company
        </h3>
        <span className="text-xs text-gray-400">{data.length} companies</span>
      </div>

      <div className="relative">
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={95}
              paddingAngle={1}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #E5E5EA',
                borderRadius: '12px',
                padding: '10px 14px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              }}
              formatter={(value: number, name: string, props: any) => [
                `${props.payload.internCount} interns, ${props.payload.logCount} logs`,
                props.payload.fullName
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ top: '-10px' }}>
          <span className="text-3xl font-bold text-gray-900">{totalInterns}</span>
          <span className="text-xs text-gray-500">Total Interns</span>
        </div>
      </div>

      {/* Legend - scrollable if many companies */}
      <div className="max-h-[200px] overflow-y-auto">
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-2 border-t border-gray-100">
          {chartData.map((item, index) => (
            <div key={index} className="flex items-center space-x-2 text-xs py-1">
              <div 
                className="w-3 h-3 rounded-full flex-shrink-0" 
                style={{ backgroundColor: item.color }}
              />
              <span className="text-gray-700 truncate flex-1" title={item.fullName}>
                {item.fullName}
              </span>
              <span className="text-gray-400 flex-shrink-0 font-medium">
                {item.internCount}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
