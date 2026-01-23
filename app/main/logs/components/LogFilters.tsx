'use client';

import { useEffect, useState } from 'react';
import { LogFilters } from '../types';
import api from '@/lib/api';
import { Search, Filter, Calendar as CalendarIcon, User, Building2, CheckCircle2, ArrowUpDown, ChevronDown, ChevronUp } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Intern {
  _id: string;
  name: string;
  studentId: string;
  company?: string;
}

interface Company {
  name: string;
  count: number;
}

interface LogFiltersProps {
  filters: LogFilters;
  onChange: (filters: LogFilters) => void;
}

export default function LogFiltersComponent({ filters, onChange }: LogFiltersProps) {
  const [interns, setInterns] = useState<Intern[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    fetchInterns();
  }, []);

  const fetchInterns = async () => {
    try {
      const response = await api.get('/interns');
      setInterns(response.data.interns);
      
      // Extract unique companies
      const companyMap = new Map<string, number>();
      response.data.interns.forEach((intern: Intern) => {
        if (intern.company) {
          companyMap.set(intern.company, (companyMap.get(intern.company) || 0) + 1);
        }
      });
      setCompanies(Array.from(companyMap.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => a.name.localeCompare(b.name)));
    } catch (error) {
      console.error('Error fetching interns:', error);
    }
  };

  const handleChange = (field: keyof LogFilters, value: string) => {
    onChange({ ...filters, [field]: value });
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsExpanded(false);
      setIsClosing(false);
    }, 400);
  };

  const applyDatePreset = (preset: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let startDate = '';
    let endDate = '';

    switch (preset) {
      case 'today':
        startDate = today.toISOString().split('T')[0];
        endDate = today.toISOString().split('T')[0];
        break;
      case 'this-week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        startDate = weekStart.toISOString().split('T')[0];
        endDate = today.toISOString().split('T')[0];
        break;
      case 'this-month':
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        startDate = monthStart.toISOString().split('T')[0];
        endDate = today.toISOString().split('T')[0];
        break;
      case 'last-7-days':
        const last7Days = new Date(today);
        last7Days.setDate(today.getDate() - 7);
        startDate = last7Days.toISOString().split('T')[0];
        endDate = today.toISOString().split('T')[0];
        break;
      case 'last-30-days':
        const last30Days = new Date(today);
        last30Days.setDate(today.getDate() - 30);
        startDate = last30Days.toISOString().split('T')[0];
        endDate = today.toISOString().split('T')[0];
        break;
      case 'custom':
        // Keep existing dates
        return;
    }

    onChange({
      ...filters,
      datePreset: preset as any,
      startDate,
      endDate,
    });
  };

  return (
    <div className={cn("mb-2", isExpanded ? "w-full" : "flex justify-end items-start w-full")}>
      {!isExpanded ? (
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          className="mac-card p-2.5 bg-black/[0.01] hover:bg-black/[0.02] transition-all duration-300 ease-out flex items-center space-x-2 cursor-pointer transform hover:scale-105 active:scale-95"
          style={{
            animation: 'slideInFromRight 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}
        >
          <Filter className="w-4 h-4 text-macos-blue transition-transform duration-300" />
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Filters</span>
          <ChevronDown className="w-3.5 h-3.5 text-gray-400 transition-transform duration-300" />
        </button>
      ) : (
        <div
          className="mac-card bg-black/[0.01] overflow-hidden p-6 w-full"
          style={{
            animation: isClosing 
              ? 'collapseUp 0.4s cubic-bezier(0.4, 0, 0.2, 1)' 
              : 'expandDown 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)',
            transformOrigin: 'top right'
          }}
        >
          <button
            type="button"
            onClick={handleClose}
            className="flex items-center justify-between w-full mb-6 hover:opacity-80 transition-opacity cursor-pointer"
          >
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-macos-blue" />
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                Filter & Sort Options
              </h3>
            </div>
            <ChevronUp className="w-4 h-4 text-gray-400" />
          </button>

          <div 
            className="space-y-6"
            style={{
              animation: isClosing
                ? 'fadeOutDown 0.35s cubic-bezier(0.4, 0, 0.2, 1)'
                : 'fadeInUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.15s both'
            }}
          >
        {/* Quick Date Presets */}
        <div className="space-y-2">
          <label className="flex items-center text-[13px] font-bold text-gray-600 ml-1">
            <CalendarIcon className="w-3.5 h-3.5 mr-2 opacity-60" />
            Quick Date Range
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'today', label: 'Today' },
              { value: 'this-week', label: 'This Week' },
              { value: 'this-month', label: 'This Month' },
              { value: 'last-7-days', label: 'Last 7 Days' },
              { value: 'last-30-days', label: 'Last 30 Days' },
              { value: 'custom', label: 'Custom Range' },
            ].map((preset) => (
              <button
                key={preset.value}
                onClick={() => applyDatePreset(preset.value)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                  filters.datePreset === preset.value
                    ? "bg-macos-blue text-white shadow-sm"
                    : "bg-black/5 text-gray-600 hover:bg-black/10"
                )}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Date Range */}
        {(filters.datePreset === 'custom' || !filters.datePreset) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="flex items-center text-[13px] font-bold text-gray-600 ml-1">
                <CalendarIcon className="w-3.5 h-3.5 mr-2 opacity-60" />
                Date From
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleChange('startDate', e.target.value)}
                className="mac-input w-full text-sm font-medium cursor-pointer"
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center text-[13px] font-bold text-gray-600 ml-1">
                <CalendarIcon className="w-3.5 h-3.5 mr-2 opacity-60" />
                Date To
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleChange('endDate', e.target.value)}
                className="mac-input w-full text-sm font-medium cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* Main Filters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Intern Filter */}
          <div className="space-y-2">
            <label className="flex items-center text-[13px] font-bold text-gray-600 ml-1">
              <User className="w-3.5 h-3.5 mr-2 opacity-60" />
              Intern Profile
            </label>
            <select
              value={filters.internId}
              onChange={(e) => handleChange('internId', e.target.value)}
              className="mac-input w-full text-sm font-medium appearance-none bg-no-repeat bg-[right_12px_center] cursor-pointer"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%238E8E93' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundSize: '16px' }}
            >
              <option value="">All Registered Interns</option>
              {interns.map((intern) => (
                <option key={intern._id} value={intern._id}>
                  {intern.name} ({intern.studentId})
                </option>
              ))}
            </select>
          </div>

          {/* Company Filter */}
          <div className="space-y-2">
            <label className="flex items-center text-[13px] font-bold text-gray-600 ml-1">
              <Building2 className="w-3.5 h-3.5 mr-2 opacity-60" />
              Company
            </label>
            <select
              value={filters.companyId}
              onChange={(e) => handleChange('companyId', e.target.value)}
              className="mac-input w-full text-sm font-medium appearance-none bg-no-repeat bg-[right_12px_center] cursor-pointer"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%238E8E93' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundSize: '16px' }}
            >
              <option value="">All Companies</option>
              {companies.map((company) => (
                <option key={company.name} value={company.name}>
                  {company.name} ({company.count})
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <label className="flex items-center text-[13px] font-bold text-gray-600 ml-1">
              <CheckCircle2 className="w-3.5 h-3.5 mr-2 opacity-60" />
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleChange('status', e.target.value)}
              className="mac-input w-full text-sm font-medium appearance-none bg-no-repeat bg-[right_12px_center] cursor-pointer"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%238E8E93' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundSize: '16px' }}
            >
              <option value="all">All Logs</option>
              <option value="complete">Complete (AM & PM)</option>
              <option value="incomplete">Incomplete</option>
              <option value="am-only">AM Only</option>
              <option value="pm-only">PM Only</option>
            </select>
          </div>
        </div>

        {/* Sort Options */}
        <div className="space-y-2">
          <label className="flex items-center text-[13px] font-bold text-gray-600 ml-1">
            <ArrowUpDown className="w-3.5 h-3.5 mr-2 opacity-60" />
            Sort By
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'newest', label: 'Newest First' },
              { value: 'oldest', label: 'Oldest First' },
              { value: 'intern-name', label: 'By Intern Name' },
            ].map((sort) => (
              <button
                key={sort.value}
                onClick={() => handleChange('sortBy', sort.value)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                  filters.sortBy === sort.value
                    ? "bg-macos-blue text-white shadow-sm"
                    : "bg-black/5 text-gray-600 hover:bg-black/10"
                )}
              >
                {sort.label}
              </button>
            ))}
          </div>
        </div>
          </div>
        </div>
      )}
    </div>
  );
}
