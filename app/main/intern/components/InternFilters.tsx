'use client';

import { useEffect, useState, useRef } from 'react';
import { InternFilters } from '../types';
import api from '@/lib/api';
import { Search, Filter, Building2, Activity, ArrowUpDown, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Company {
  name: string;
  count: number;
}

interface InternFiltersProps {
  filters: InternFilters;
  onChange: (filters: InternFilters) => void;
}

export default function InternFiltersComponent({ filters, onChange }: InternFiltersProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [searchValue, setSearchValue] = useState(filters.search);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    setSearchValue(filters.search);
  }, [filters.search]);

  const fetchCompanies = async () => {
    try {
      const response = await api.get('/interns');
      const companyMap = new Map<string, number>();
      response.data.interns.forEach((intern: any) => {
        if (intern.company) {
          companyMap.set(intern.company, (companyMap.get(intern.company) || 0) + 1);
        }
      });
      setCompanies(Array.from(companyMap.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => a.name.localeCompare(b.name)));
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      onChange({ ...filters, search: value });
    }, 300);
  };

  const handleChange = (field: keyof InternFilters, value: string) => {
    onChange({ ...filters, [field]: value });
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsExpanded(false);
      setIsClosing(false);
    }, 400);
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
        {/* Search */}
        <div className="space-y-2">
          <label className="flex items-center text-[13px] font-bold text-gray-600 ml-1">
            <Search className="w-3.5 h-3.5 mr-2 opacity-60" />
            Search
          </label>
          <input
            type="text"
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search by name, email, or student ID..."
            className="mac-input w-full text-sm font-medium"
          />
        </div>

        {/* Main Filters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Company Filter */}
          <div className="space-y-2">
            <label className="flex items-center text-[13px] font-bold text-gray-600 ml-1">
              <Building2 className="w-3.5 h-3.5 mr-2 opacity-60" />
              Company
            </label>
            <select
              value={filters.company}
              onChange={(e) => handleChange('company', e.target.value)}
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

          {/* Activity Status Filter */}
          <div className="space-y-2">
            <label className="flex items-center text-[13px] font-bold text-gray-600 ml-1">
              <Activity className="w-3.5 h-3.5 mr-2 opacity-60" />
              Activity Status
            </label>
            <select
              value={filters.activityStatus}
              onChange={(e) => handleChange('activityStatus', e.target.value)}
              className="mac-input w-full text-sm font-medium appearance-none bg-no-repeat bg-[right_12px_center] cursor-pointer"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%238E8E93' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundSize: '16px' }}
            >
              <option value="all">All Interns</option>
              <option value="with-logs">With Logs</option>
              <option value="without-logs">Without Logs</option>
              <option value="active">Active (Last 30 Days)</option>
              <option value="inactive">Inactive (No Logs 30+ Days)</option>
            </select>
          </div>
        </div>

        {/* Quick Filters */}
        <div className="space-y-2">
          <label className="flex items-center text-[13px] font-bold text-gray-600 ml-1">
            <Clock className="w-3.5 h-3.5 mr-2 opacity-60" />
            Quick Filters
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'all', label: 'All Interns' },
              { value: 'recently-added', label: 'Recently Added (7 Days)' },
              { value: 'recently-active', label: 'Recently Active (7 Days)' },
            ].map((filter) => (
              <button
                key={filter.value}
                onClick={() => handleChange('quickFilter', filter.value)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                  filters.quickFilter === filter.value
                    ? "bg-macos-blue text-white shadow-sm"
                    : "bg-black/5 text-gray-600 hover:bg-black/10"
                )}
              >
                {filter.label}
              </button>
            ))}
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
              { value: 'name-asc', label: 'Name (A-Z)' },
              { value: 'name-desc', label: 'Name (Z-A)' },
              { value: 'created-newest', label: 'Newest First' },
              { value: 'created-oldest', label: 'Oldest First' },
              { value: 'most-active', label: 'Most Active' },
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
