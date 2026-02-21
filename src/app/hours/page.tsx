'use client';

import { useMemo, useState } from 'react';
import { useData } from '@/lib/data-context';
import { useFilters } from '@/lib/filter-context';
import { FilterBar } from '@/components/filter-bar';
import { Icon } from '@/components/Icon';
import download from 'lucide-static/icons/download.svg';
import arrowUpDown from 'lucide-static/icons/arrow-up-down.svg';
import { formatDKK, formatHours } from '@/lib/date-utils';

type SortKey = 'date' | 'client' | 'project' | 'resource' | 'hours' | 'totalDKK' | 'rate';

export default function HoursPage() {
  const { data, loading, error } = useData();
  const { filteredEntries } = useFilters();
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortAsc, setSortAsc] = useState(false);
  const [search, setSearch] = useState('');

  const sorted = useMemo(() => {
    let entries = [...filteredEntries];
    if (search) {
      const q = search.toLowerCase();
      entries = entries.filter(e =>
        e.client.toLowerCase().includes(q) || e.project.toLowerCase().includes(q) ||
        e.resource.toLowerCase().includes(q) || e.description.toLowerCase().includes(q) ||
        e.activity.toLowerCase().includes(q)
      );
    }
    entries.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'date': cmp = a.date.localeCompare(b.date); break;
        case 'client': cmp = a.client.localeCompare(b.client); break;
        case 'project': cmp = a.project.localeCompare(b.project); break;
        case 'resource': cmp = a.resource.localeCompare(b.resource); break;
        case 'hours': cmp = a.hours - b.hours; break;
        case 'totalDKK': cmp = a.totalDKK - b.totalDKK; break;
        case 'rate': cmp = a.rate - b.rate; break;
      }
      return sortAsc ? cmp : -cmp;
    });
    return entries;
  }, [filteredEntries, sortKey, sortAsc, search]);

  const totalHours = useMemo(() => sorted.reduce((s, e) => s + e.hours, 0), [sorted]);
  const totalDKK = useMemo(() => sorted.reduce((s, e) => s + e.totalDKK, 0), [sorted]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(false); }
  }

  function exportCSV() {
    const headers = ['Date', 'Client', 'Project', 'Sub Project', 'Budget ID', 'Activity', 'Resource', 'Description', 'Hours', 'Rate', 'Total DKK'];
    const rows = sorted.map(e => [
      e.date, e.client, e.project, e.subProject, e.budgetId, e.activity, e.resource,
      `"${e.description.replace(/"/g, '""')}"`, e.hours, e.rate, e.totalDKK,
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kyodo-hours-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-pulse text-stone-400">Loading...</div></div>;
  if (error || !data) return <div className="flex items-center justify-center h-screen"><div className="text-red-500">Error: {error}</div></div>;

  const SortHeader = ({ label, field, align }: { label: string; field: SortKey; align?: string }) => (
    <th
      className={`px-4 py-2.5 cursor-pointer hover:text-stone-700 dark:hover:text-stone-200 select-none ${align === 'right' ? 'text-right' : 'text-left'}`}
      onClick={() => toggleSort(field)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <Icon src={arrowUpDown} className={`size-3 ${sortKey === field ? 'text-stone-900 dark:text-stone-100' : 'text-stone-300 dark:text-stone-600'}`} />
      </span>
    </th>
  );

  return (
    <div className="bg-white dark:bg-[#0a0a0a]">
      <FilterBar />

      <div className="p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <input
              type="text"
              placeholder="Search entries..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-9 px-3 text-sm border border-stone-200 dark:border-white/[0.10] rounded-md bg-white dark:bg-[#161618] text-stone-900 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 w-64 placeholder:text-stone-400 dark:placeholder:text-stone-500"
            />
            <span className="text-sm text-stone-500 dark:text-stone-400">
              {sorted.length} entries | {formatHours(totalHours)} hrs | {formatDKK(totalDKK)} kr.
            </span>
          </div>
          <button onClick={exportCSV}
            className="h-9 px-4 text-sm font-medium text-white bg-stone-900 dark:bg-stone-700 rounded-lg hover:bg-stone-800 dark:hover:bg-stone-600 transition-colors flex items-center gap-2"
          >
            <Icon src={download} className="size-3.5" />
            Export CSV
          </button>
        </div>

        <div className="bg-white dark:bg-[#161618] rounded-xl border border-stone-200 dark:border-white/[0.10] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-stone-50 dark:bg-white/[0.03] text-xs text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                  <SortHeader label="Date" field="date" />
                  <SortHeader label="Client" field="client" />
                  <SortHeader label="Project" field="project" />
                  <th className="px-4 py-2.5 text-left">Activity</th>
                  <SortHeader label="Resource" field="resource" />
                  <th className="px-4 py-2.5 text-left">Description</th>
                  <SortHeader label="Hours" field="hours" align="right" />
                  <SortHeader label="Rate" field="rate" align="right" />
                  <SortHeader label="Total DKK" field="totalDKK" align="right" />
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-white/[0.06]">
                {sorted.slice(0, 200).map((e, i) => (
                  <tr key={i} className="hover:bg-stone-50 dark:hover:bg-white/[0.03]">
                    <td className="px-4 py-2.5 text-stone-600 dark:text-stone-400 whitespace-nowrap">{e.date}</td>
                    <td className="px-4 py-2.5 font-medium text-stone-900 dark:text-stone-100">{e.client}</td>
                    <td className="px-4 py-2.5 text-stone-700 dark:text-stone-300">{e.project}</td>
                    <td className="px-4 py-2.5 text-stone-500 dark:text-stone-400">{e.activity}</td>
                    <td className="px-4 py-2.5 text-stone-600 dark:text-stone-400">{e.resource}</td>
                    <td className="px-4 py-2.5 text-stone-500 dark:text-stone-400 max-w-[200px] truncate" title={e.description}>{e.description}</td>
                    <td className="px-4 py-2.5 text-right text-stone-700 dark:text-stone-300">{e.hours}</td>
                    <td className="px-4 py-2.5 text-right text-stone-500 dark:text-stone-400">{formatDKK(e.rate)}</td>
                    <td className="px-4 py-2.5 text-right font-medium text-stone-900 dark:text-stone-100">{formatDKK(e.totalDKK)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-stone-50 dark:bg-white/[0.03] font-semibold border-t border-stone-200 dark:border-white/[0.06]">
                  <td className="px-4 py-2.5 text-stone-900 dark:text-stone-100" colSpan={6}>Total ({sorted.length} entries)</td>
                  <td className="px-4 py-2.5 text-right text-stone-900 dark:text-stone-100">{formatHours(totalHours)}</td>
                  <td className="px-4 py-2.5 text-right text-stone-500 dark:text-stone-400">
                    {totalHours > 0 ? formatDKK(Math.round(totalDKK / totalHours)) : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-right text-stone-900 dark:text-stone-100">{formatDKK(totalDKK)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          {sorted.length > 200 && (
            <div className="px-5 py-3 text-sm text-stone-500 dark:text-stone-400 bg-stone-50 dark:bg-white/[0.03] border-t border-stone-200 dark:border-white/[0.06]">
              Showing first 200 of {sorted.length} entries. Use filters to narrow results, or export CSV for all data.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
