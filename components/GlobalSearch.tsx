'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Search, X, FileText, Users, Building2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

interface SearchResult {
  type: 'intern' | 'log' | 'company';
  id: string;
  title: string;
  subtitle: string;
  metadata?: string;
}

export default function GlobalSearch() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => performSearch(query), 300);
    return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current); };
  }, [query]);

  const performSearch = async (searchQuery: string) => {
    setLoading(true);
    try {
      const [internsRes, logsRes] = await Promise.all([
        api.get(`/interns?search=${encodeURIComponent(searchQuery)}`),
        api.get(`/logs?sortBy=newest`)
      ]);
      const interns: SearchResult[] = internsRes.data.interns.slice(0, 5).map((i: any) => ({
        type: 'intern' as const, id: i._id, title: i.name, subtitle: i.email,
        metadata: `${i.studentId} • ${i.company}`
      }));
      const allLogs = logsRes.data.logs || [];
      const filteredLogs = allLogs.filter((log: any) => {
        const name = log.internId?.name?.toLowerCase() || '';
        const addr = log.amLog?.location?.address?.toLowerCase() || log.pmLog?.location?.address?.toLowerCase() || '';
        return name.includes(searchQuery.toLowerCase()) || addr.includes(searchQuery.toLowerCase());
      });
      const logs: SearchResult[] = filteredLogs.slice(0, 5).map((log: any) => ({
        type: 'log' as const, id: log._id,
        title: `${log.internId?.name || 'Unknown'} - ${format(new Date(log.date), 'MMM d, yyyy')}`,
        subtitle: log.amLog?.location?.address || log.pmLog?.location?.address || 'No location',
        metadata: `${log.amLog ? 'AM' : ''}${log.amLog && log.pmLog ? ' & ' : ''}${log.pmLog ? 'PM' : ''}`
      }));
      const companyMap = new Map<string, number>();
      internsRes.data.interns.forEach((i: any) => {
        if (i.company && i.company.toLowerCase().includes(searchQuery.toLowerCase())) {
          companyMap.set(i.company, (companyMap.get(i.company) || 0) + 1);
        }
      });
      const companies: SearchResult[] = Array.from(companyMap.entries()).slice(0, 3).map(([c, count]) => ({
        type: 'company' as const, id: c, title: c, subtitle: `${count} intern${count !== 1 ? 's' : ''}`
      }));
      setResults([...interns, ...logs, ...companies]);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    setIsOpen(false);
    setQuery('');
    if (result.type === 'intern') router.push('/main/intern');
    else if (result.type === 'log') router.push('/main/logs');
    else if (result.type === 'company') router.push(`/main/intern?company=${encodeURIComponent(result.id)}`);
  };

  const getIcon = (type: string) => {
    if (type === 'intern') return Users;
    if (type === 'log') return FileText;
    return Building2;
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder="Search interns, logs, companies..."
          className="mac-input w-full !pl-[52px] pr-10 text-sm font-medium"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setIsOpen(false); }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-black/5 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>
      <AnimatePresence>
        {isOpen && query.length >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full mt-2 w-full mac-card shadow-2xl z-50 max-h-[500px] overflow-y-auto"
          >
            {loading ? (
              <div className="p-8 text-center text-gray-400">
                <div className="animate-spin w-6 h-6 border-2 border-macos-blue border-t-transparent rounded-full mx-auto mb-2" />
                <p className="text-sm">Searching...</p>
              </div>
            ) : results.length > 0 ? (
              <div className="p-2">
                {results.map((r, i) => {
                  const Icon = getIcon(r.type);
                  return (
                    <motion.button
                      key={`${r.type}-${r.id}-${i}`}
                      whileHover={{ x: 4 }}
                      onClick={() => handleResultClick(r)}
                      className="w-full flex items-start space-x-3 p-3 rounded-xl hover:bg-black/5 transition-colors text-left"
                    >
                      <div className="w-10 h-10 rounded-lg bg-macos-blue/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-macos-blue" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-gray-900 truncate">{r.title}</div>
                        <div className="text-xs text-gray-500 truncate">{r.subtitle}</div>
                        {r.metadata && <div className="text-xs text-gray-400 mt-1">{r.metadata}</div>}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-400">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No results found</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      {isOpen && <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />}
    </div>
  );
}
