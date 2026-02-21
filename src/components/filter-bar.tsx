'use client';

import { useMemo } from 'react';
import { useData } from '@/lib/data-context';
import { useFilters } from '@/lib/filter-context';
import { Icon } from './Icon';
import rotateCcw from 'lucide-static/icons/rotate-ccw.svg';
import chevronDown from 'lucide-static/icons/chevron-down.svg';
import { getMonthLabelFull } from '@/lib/date-utils';

function Select({ value, onChange, children, className = '' }: {
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="appearance-none h-9 pl-3 pr-8 text-sm border border-stone-200 dark:border-white/[0.10] rounded-lg bg-white dark:bg-[#161618] text-stone-900 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 focus:border-[#6366f1] w-full cursor-pointer"
      >
        {children}
      </select>
      <Icon
        src={chevronDown}
        className="size-3.5 text-stone-400 dark:text-stone-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
      />
    </div>
  );
}

export function FilterBar() {
  const { data } = useData();
  const {
    filters,
    setFilters,
    resetFilters,
    uniqueClients,
    uniqueProjects,
    uniqueResources,
    isAllTime,
  } = useFilters();

  const { uniqueYears, uniqueMonths } = useMemo(() => {
    if (!data) return { uniqueYears: [], uniqueMonths: [] };
    const monthSet = new Set<string>();
    const yearSet = new Set<number>();
    for (const e of data.entries) {
      monthSet.add(e.date.slice(0, 7));
      yearSet.add(parseInt(e.date.slice(0, 4)));
    }
    return {
      uniqueYears: [...yearSet].sort().reverse(),
      uniqueMonths: [...monthSet].sort().reverse(),
    };
  }, [data]);

  const periodValue = isAllTime
    ? (filters.dateFrom ? `year-${filters.dateFrom.slice(0, 4)}` : 'all')
    : filters.selectedMonth;

  function handlePeriodChange(value: string) {
    if (value === 'all') {
      setFilters({ isAllTime: true, dateFrom: '', dateTo: '' });
    } else if (value.startsWith('year-')) {
      const y = value.slice(5);
      setFilters({ isAllTime: true, dateFrom: `${y}-01-01`, dateTo: `${y}-12-31` });
    } else {
      setFilters({ selectedMonth: value, isAllTime: false, dateFrom: '', dateTo: '' });
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2.5 px-6 py-3 bg-white dark:bg-[#0a0a0a] border-b border-stone-200 dark:border-white/[0.06]">
      <Select value={periodValue} onChange={handlePeriodChange} className="min-w-[160px]">
        <option value="all">All time</option>
        {uniqueYears.map(y => (
          <option key={`year-${y}`} value={`year-${y}`}>{y}</option>
        ))}
        <option disabled>──────────</option>
        {uniqueMonths.map(m => {
          const [y, mo] = m.split('-').map(Number);
          return <option key={m} value={m}>{getMonthLabelFull(mo)} {y}</option>;
        })}
      </Select>

      <Select
        value={filters.clients[0] || ''}
        onChange={v => setFilters({ clients: v ? [v] : [] })}
        className="min-w-[140px]"
      >
        <option value="">All clients</option>
        {uniqueClients.map(c => (
          <option key={c} value={c}>{c}</option>
        ))}
      </Select>

      <Select
        value={filters.projects[0] || ''}
        onChange={v => setFilters({ projects: v ? [v] : [] })}
        className="min-w-[140px]"
      >
        <option value="">All projects</option>
        {uniqueProjects.map(p => (
          <option key={p} value={p}>{p}</option>
        ))}
      </Select>

      <Select
        value={filters.resources[0] || ''}
        onChange={v => setFilters({ resources: v ? [v] : [] })}
        className="min-w-[120px]"
      >
        <option value="">All resources</option>
        {uniqueResources.map(r => (
          <option key={r} value={r}>{r}</option>
        ))}
      </Select>

      <button
        onClick={resetFilters}
        className="h-9 px-3 text-sm text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 rounded-lg hover:bg-stone-100 dark:hover:bg-white/[0.06] transition-colors flex items-center gap-1.5"
      >
        <Icon src={rotateCcw} className="size-3.5" />
        Reset
      </button>
    </div>
  );
}
