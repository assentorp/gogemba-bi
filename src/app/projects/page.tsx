'use client';

import { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useData } from '@/lib/data-context';
import { useFilters } from '@/lib/filter-context';
import { useTheme } from '@/context/ThemeContext';
import { FilterBar } from '@/components/filter-bar';
import { Icon } from '@/components/Icon';
import chevronDown from 'lucide-static/icons/chevron-down.svg';
import chevronUp from 'lucide-static/icons/chevron-up.svg';
import { formatDKK, formatHours, getMonthLabel } from '@/lib/date-utils';
import { sumDKK, sumHours, getEntriesYTD } from '@/lib/calculations';
import type { TimesheetEntry } from '@/lib/types';

const COLORS = ['#292524', '#44403c', '#57534e', '#78716c', '#a8a29e', '#d6d3d1', '#e7e5e4', '#a3a3a3', '#737373', '#525252'];

interface ProjectSummary {
  project: string;
  client: string;
  budgetId: string;
  hours: number;
  revenue: number;
  rate: number;
  entries: TimesheetEntry[];
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-[#1e1e20] rounded-lg shadow-lg border border-stone-200 dark:border-white/[0.10] p-3 text-sm">
      <p className="font-medium text-stone-900 dark:text-stone-100 mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-stone-700 dark:text-stone-300">
          {entry.name}: {formatDKK(entry.value)} kr.
        </p>
      ))}
    </div>
  );
}

export default function ProjectsPage() {
  const { data, loading, error } = useData();
  const { filteredEntries, selectedYear, selectedMonth, isAllTime } = useFilters();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'revenue' | 'hours'>('revenue');

  const gridColor = isDark ? '#333' : '#f0f0f0';
  const textColor = isDark ? '#a8a29e' : '#6b7280';

  const projects = useMemo(() => {
    const map = new Map<string, ProjectSummary>();
    const ytd = isAllTime ? filteredEntries : getEntriesYTD(filteredEntries, selectedYear, selectedMonth);

    for (const e of ytd) {
      const key = `${e.client}-${e.project}`;
      if (!map.has(key)) {
        map.set(key, { project: e.project, client: e.client, budgetId: e.budgetId, hours: 0, revenue: 0, rate: 0, entries: [] });
      }
      const p = map.get(key)!;
      p.hours += e.hours;
      p.revenue += e.totalDKK;
      p.entries.push(e);
    }

    for (const p of map.values()) {
      p.rate = p.hours > 0 ? p.revenue / p.hours : 0;
    }

    return [...map.values()].sort((a, b) => sortField === 'revenue' ? b.revenue - a.revenue : b.hours - a.hours);
  }, [filteredEntries, selectedYear, selectedMonth, sortField, isAllTime]);

  const topProjectsChart = useMemo(() => {
    return projects.slice(0, 10).map(p => ({
      name: p.project.length > 18 ? p.project.slice(0, 16) + '...' : p.project,
      revenue: p.revenue,
    }));
  }, [projects]);

  const clientBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of projects) map.set(p.client, (map.get(p.client) || 0) + p.revenue);
    return [...map.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [projects]);

  const totalRevenue = useMemo(() => projects.reduce((s, p) => s + p.revenue, 0), [projects]);
  const totalHours = useMemo(() => projects.reduce((s, p) => s + p.hours, 0), [projects]);

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-pulse text-stone-400">Loading...</div></div>;
  if (error || !data) return <div className="flex items-center justify-center h-screen"><div className="text-red-500">Error: {error}</div></div>;

  return (
    <div className="bg-white dark:bg-[#0a0a0a]">
      <FilterBar />

      <div className="p-6 space-y-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Projects', value: String(projects.length) },
            { label: 'Total Revenue (YTD)', value: `${formatDKK(totalRevenue)} kr.` },
            { label: 'Total Hours (YTD)', value: formatHours(totalHours) },
            { label: 'Avg Rate', value: `${formatDKK(Math.round(totalHours > 0 ? totalRevenue / totalHours : 0))} kr.` },
          ].map((card, i) => (
            <div key={i} className="bg-white dark:bg-[#161618] rounded-xl border border-stone-200 dark:border-white/[0.10] p-4">
              <p className="text-[11px] text-stone-500 dark:text-stone-400 uppercase tracking-wider">{card.label}</p>
              <p className="text-2xl font-semibold mt-1 text-stone-900 dark:text-stone-100">{card.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-[#161618] rounded-xl border border-stone-200 dark:border-white/[0.10] p-5">
            <h3 className="text-sm font-medium text-stone-900 dark:text-stone-100 mb-4">Top Projects by Revenue</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProjectsChart} layout="vertical" margin={{ left: 10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                  <XAxis type="number" tickFormatter={v => `${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 11, fill: textColor }} />
                  <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11, fill: textColor }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="revenue" name="Revenue" fill={isDark ? '#e5e5e5' : '#292524'} radius={[0, 4, 4, 0]} maxBarSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white dark:bg-[#161618] rounded-xl border border-stone-200 dark:border-white/[0.10] p-5">
            <h3 className="text-sm font-medium text-stone-900 dark:text-stone-100 mb-4">Revenue by Client</h3>
            <div className="h-72 flex items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={clientBreakdown} cx="50%" cy="50%" innerRadius="40%" outerRadius="70%" dataKey="value"
                    label={({ name, percent, x, y, textAnchor }) => (
                      <text x={x} y={y} textAnchor={textAnchor} fill={isDark ? '#d6d3d1' : '#44403c'} fontSize={12}>
                        {name} ({((percent ?? 0) * 100).toFixed(0)}%)
                      </text>
                    )}
                    labelLine={{ strokeWidth: 1, stroke: isDark ? '#525252' : '#d6d3d1' }}
                  >
                    {clientBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value) => `${formatDKK(Number(value))} kr.`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#161618] rounded-xl border border-stone-200 dark:border-white/[0.10] overflow-hidden">
          <div className="px-5 py-3 border-b border-stone-200 dark:border-white/[0.06] flex items-center justify-between">
            <h3 className="text-sm font-medium text-stone-900 dark:text-stone-100">All Projects</h3>
            <div className="flex gap-2 text-xs">
              {(['revenue', 'hours'] as const).map(f => (
                <button key={f} onClick={() => setSortField(f)}
                  className={`px-2 py-1 rounded ${sortField === f ? 'bg-stone-100 dark:bg-white/[0.06] text-stone-900 dark:text-stone-100 font-medium' : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'}`}
                >
                  By {f === 'revenue' ? 'Revenue' : 'Hours'}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-stone-50 dark:bg-white/[0.03] text-left text-xs text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                  <th className="px-5 py-2.5">Client</th>
                  <th className="px-5 py-2.5">Project</th>
                  <th className="px-5 py-2.5 text-right">Hours</th>
                  <th className="px-5 py-2.5 text-right">Revenue</th>
                  <th className="px-5 py-2.5 text-right">Avg Rate</th>
                  <th className="px-5 py-2.5 w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-white/[0.06]">
                {projects.map(p => {
                  const key = `${p.client}-${p.project}`;
                  const isExpanded = expandedProject === key;
                  const monthlyData = isExpanded ? (() => {
                    const months: Record<number, { hours: number; revenue: number }> = {};
                    for (const e of p.entries) {
                      const m = parseInt(e.date.split('-')[1]);
                      if (!months[m]) months[m] = { hours: 0, revenue: 0 };
                      months[m].hours += e.hours;
                      months[m].revenue += e.totalDKK;
                    }
                    return Object.entries(months).map(([m, d]) => ({ month: parseInt(m), ...d })).sort((a, b) => a.month - b.month);
                  })() : [];

                  return (
                    <tr key={key}>
                      <td colSpan={6} className="p-0">
                        <div className="flex items-center cursor-pointer hover:bg-stone-50 dark:hover:bg-white/[0.03] px-5 py-3"
                          onClick={() => setExpandedProject(isExpanded ? null : key)}>
                          <div className="flex-1 grid grid-cols-[1fr_1fr_auto_auto_auto_auto] gap-4 items-center">
                            <span className="font-medium text-stone-900 dark:text-stone-100">{p.client}</span>
                            <span className="text-stone-600 dark:text-stone-400">{p.project}</span>
                            <span className="text-right w-20 text-stone-700 dark:text-stone-300">{formatHours(p.hours)}</span>
                            <span className="text-right font-medium w-28 text-stone-900 dark:text-stone-100">{formatDKK(p.revenue)} kr.</span>
                            <span className="text-right text-stone-500 dark:text-stone-400 w-20">{formatDKK(Math.round(p.rate))}</span>
                            <span className="w-6 flex justify-center text-stone-400">
                              <Icon src={isExpanded ? chevronUp : chevronDown} className="size-3.5" />
                            </span>
                          </div>
                        </div>
                        {isExpanded && monthlyData.length > 0 && (
                          <div className="px-5 pb-4 bg-stone-50/50 dark:bg-white/[0.02]">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="text-stone-400">
                                  <th className="py-1 text-left pl-8">Month</th>
                                  <th className="py-1 text-right">Hours</th>
                                  <th className="py-1 text-right">Revenue</th>
                                </tr>
                              </thead>
                              <tbody>
                                {monthlyData.map(md => (
                                  <tr key={md.month} className="border-t border-stone-100 dark:border-white/[0.06]">
                                    <td className="py-1.5 pl-8 text-stone-600 dark:text-stone-400">{getMonthLabel(md.month)} {selectedYear}</td>
                                    <td className="py-1.5 text-right text-stone-700 dark:text-stone-300">{formatHours(md.hours)}</td>
                                    <td className="py-1.5 text-right font-medium text-stone-900 dark:text-stone-100">{formatDKK(md.revenue)} kr.</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
