'use client';

import { useMemo } from 'react';
import { format, startOfYear, eachDayOfInterval, isSameDay, parseISO } from 'date-fns';

interface HeatmapData {
  date: string;
  count: number;
}

interface AttendanceHeatmapProps {
  data: HeatmapData[];
  onDateClick?: (date: string) => void;
}

export default function AttendanceHeatmap({ data, onDateClick }: AttendanceHeatmapProps) {
  const heatmapMap = useMemo(() => {
    const map = new Map<string, number>();
    data.forEach(item => {
      map.set(item.date, item.count);
    });
    return map;
  }, [data]);

  const yearStart = startOfYear(new Date());
  const today = new Date();
  const days = eachDayOfInterval({ start: yearStart, end: today });

  const getIntensity = (count: number): string => {
    if (count === 0) return 'bg-gray-100';
    if (count <= 2) return 'bg-green-200';
    if (count <= 5) return 'bg-green-400';
    if (count <= 10) return 'bg-green-600';
    return 'bg-green-800';
  };

  const getTooltip = (date: Date, count: number): string => {
    const dateStr = format(date, 'MMM d, yyyy');
    return `${dateStr}: ${count} log${count !== 1 ? 's' : ''}`;
  };

  // Group days by week
  const weeks: Date[][] = [];
  let currentWeek: Date[] = [];
  
  days.forEach((day, index) => {
    const dayOfWeek = day.getDay();
    if (dayOfWeek === 0 && currentWeek.length > 0) {
      weeks.push([...currentWeek]);
      currentWeek = [];
    }
    currentWeek.push(day);
    if (index === days.length - 1 && currentWeek.length > 0) {
      weeks.push(currentWeek);
    }
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-600 uppercase tracking-widest">Attendance Heatmap</h3>
        <div className="flex items-center space-x-4 text-xs text-gray-500">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded bg-gray-100" />
            <span>None</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded bg-green-200" />
            <span>Low</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded bg-green-400" />
            <span>Medium</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded bg-green-600" />
            <span>High</span>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <div className="flex space-x-1 min-w-max">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col space-y-1">
              {week.map((day, dayIndex) => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const count = heatmapMap.get(dateStr) || 0;
                const isToday = isSameDay(day, today);
                
                return (
                  <div
                    key={dayIndex}
                    className={`
                      w-3 h-3 rounded cursor-pointer transition-all hover:scale-110 hover:ring-2 hover:ring-macos-blue
                      ${getIntensity(count)}
                      ${isToday ? 'ring-2 ring-macos-blue' : ''}
                    `}
                    title={getTooltip(day, count)}
                    onClick={() => onDateClick?.(dateStr)}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <p className="text-xs text-gray-400 mt-2">Click on a date to view logs for that day</p>
    </div>
  );
}
