'use client';

import { useMemo } from 'react';
import { useData } from '@/lib/data-context';
import { useFilters } from '@/lib/filter-context';
import { FilterBar } from '@/components/filter-bar';
import { Icon } from '@/components/Icon';
import printer from 'lucide-static/icons/printer.svg';
import { formatDKK, formatHours, getMonthLabelFull, getMonthLabel } from '@/lib/date-utils';
import { sumDKK, sumHours, avgRate, getEntriesYTD, getEntriesForMonth, activeProjectCount } from '@/lib/calculations';

export default function ReportsPage() {
  const { data, loading, error } = useData();
  const { filteredEntries, selectedYear, selectedMonth, isAllTime } = useFilters();

  const ytdEntries = useMemo(() => isAllTime ? filteredEntries : getEntriesYTD(filteredEntries, selectedYear, selectedMonth), [filteredEntries, selectedYear, selectedMonth, isAllTime]);

  const projectSummary = useMemo(() => {
    const map = new Map<string, { client: string; project: string; hours: number; revenue: number }>();
    for (const e of ytdEntries) {
      const key = `${e.client}-${e.project}`;
      if (!map.has(key)) map.set(key, { client: e.client, project: e.project, hours: 0, revenue: 0 });
      const p = map.get(key)!;
      p.hours += e.hours;
      p.revenue += e.totalDKK;
    }
    return [...map.values()].sort((a, b) => b.revenue - a.revenue);
  }, [ytdEntries]);

  const monthlySummary = useMemo(() => {
    if (isAllTime) {
      const map = new Map<string, { key: string; label: string; hours: number; revenue: number }>();
      for (const e of filteredEntries) {
        const key = e.date.slice(0, 7);
        if (!map.has(key)) {
          const [y, m] = key.split('-').map(Number);
          map.set(key, { key, label: `${getMonthLabel(m)} ${y}`, hours: 0, revenue: 0 });
        }
        const entry = map.get(key)!;
        entry.hours += e.hours;
        entry.revenue += e.totalDKK;
      }
      return [...map.values()].sort((a, b) => a.key.localeCompare(b.key)).map((v, i) => ({ month: i, ...v }));
    }
    const months: { month: number; label: string; hours: number; revenue: number }[] = [];
    for (let m = 1; m <= selectedMonth; m++) {
      const monthEntries = getEntriesForMonth(filteredEntries, selectedYear, m);
      months.push({ month: m, label: `${getMonthLabel(m)} ${selectedYear}`, hours: sumHours(monthEntries), revenue: sumDKK(monthEntries) });
    }
    return months;
  }, [filteredEntries, selectedYear, selectedMonth, isAllTime]);

  const resourceSummary = useMemo(() => {
    const map = new Map<string, { resource: string; hours: number; revenue: number }>();
    for (const e of ytdEntries) {
      if (!map.has(e.resource)) map.set(e.resource, { resource: e.resource, hours: 0, revenue: 0 });
      const r = map.get(e.resource)!;
      r.hours += e.hours;
      r.revenue += e.totalDKK;
    }
    return [...map.values()].sort((a, b) => b.revenue - a.revenue);
  }, [ytdEntries]);

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-pulse text-stone-400">Loading...</div></div>;
  if (error || !data) return <div className="flex items-center justify-center h-screen"><div className="text-red-500">Error: {error}</div></div>;

  const totalHours = sumHours(ytdEntries);
  const totalRevenue = sumDKK(ytdEntries);
  const rate = avgRate(ytdEntries);
  const projects = activeProjectCount(ytdEntries);

  const thClass = "px-4 py-2.5 text-left text-xs text-stone-500 dark:text-stone-400 uppercase tracking-wider";
  const tdClass = "px-4 py-2 text-stone-700 dark:text-stone-300";

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a]">
      <div className="no-print"><FilterBar /></div>

      <div className="p-6 no-print">
        <button onClick={() => window.print()}
          className="h-9 px-4 text-sm font-medium text-white bg-stone-900 dark:bg-stone-700 rounded-lg hover:bg-stone-800 dark:hover:bg-stone-600 transition-colors flex items-center gap-2"
        >
          <Icon src={printer} className="size-3.5" />
          Print / Save as PDF
        </button>
      </div>

      <div className="px-6 pb-8 max-w-4xl mx-auto" id="report-content">
        <div className="border-b-2 border-indigo-500 pb-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-stone-900 dark:text-stone-100">Kyodo Monthly Report</h2>
              <p className="text-stone-500 dark:text-stone-400 mt-1">Period: {isAllTime ? 'All Time' : `January - ${getMonthLabelFull(selectedMonth)} ${selectedYear}`}</p>
            </div>
            <span className="text-lg font-semibold tracking-tight text-stone-900 dark:text-stone-100">
              kyodo <span className="text-stone-500 dark:text-stone-400">lab</span>
            </span>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-sm font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-3">Executive Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Revenue', value: `${formatDKK(totalRevenue)} kr.` },
              { label: 'Total Hours', value: formatHours(totalHours) },
              { label: 'Avg Rate', value: `${formatDKK(Math.round(rate))} kr.` },
              { label: 'Active Projects', value: String(projects) },
            ].map((card, i) => (
              <div key={i} className="bg-stone-50 dark:bg-white/[0.03] rounded-lg p-3">
                <p className="text-xs text-stone-500 dark:text-stone-400">{card.label}</p>
                <p className="text-xl font-semibold text-stone-900 dark:text-stone-100">{card.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-sm font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-3">Monthly Breakdown</h3>
          <table className="w-full text-sm border border-stone-200 dark:border-white/[0.10] rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-stone-50 dark:bg-white/[0.03]">
                <th className={thClass}>Month</th>
                <th className={`${thClass} text-right`}>Hours</th>
                <th className={`${thClass} text-right`}>Revenue</th>
                <th className={`${thClass} text-right`}>Avg Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-white/[0.06]">
              {monthlySummary.map(m => (
                <tr key={m.month}>
                  <td className={tdClass}>{m.label}</td>
                  <td className={`${tdClass} text-right`}>{formatHours(m.hours)}</td>
                  <td className={`${tdClass} text-right font-medium text-stone-900 dark:text-stone-100`}>{formatDKK(m.revenue)} kr.</td>
                  <td className={`${tdClass} text-right`}>{m.hours > 0 ? `${formatDKK(Math.round(m.revenue / m.hours))} kr.` : '—'}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-stone-50 dark:bg-white/[0.03] font-semibold border-t border-stone-200 dark:border-white/[0.06]">
                <td className="px-4 py-2 text-stone-900 dark:text-stone-100">Total</td>
                <td className="px-4 py-2 text-right text-stone-900 dark:text-stone-100">{formatHours(totalHours)}</td>
                <td className="px-4 py-2 text-right text-stone-900 dark:text-stone-100">{formatDKK(totalRevenue)} kr.</td>
                <td className="px-4 py-2 text-right text-stone-500 dark:text-stone-400">{totalHours > 0 ? `${formatDKK(Math.round(rate))} kr.` : '—'}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="mb-8 print-break">
          <h3 className="text-sm font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-3">Project Breakdown</h3>
          <table className="w-full text-sm border border-stone-200 dark:border-white/[0.10] rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-stone-50 dark:bg-white/[0.03]">
                <th className={thClass}>Client</th>
                <th className={thClass}>Project</th>
                <th className={`${thClass} text-right`}>Hours</th>
                <th className={`${thClass} text-right`}>Revenue</th>
                <th className={`${thClass} text-right`}>% of Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-white/[0.06]">
              {projectSummary.map((p, i) => (
                <tr key={i}>
                  <td className={`${tdClass} font-medium text-stone-900 dark:text-stone-100`}>{p.client}</td>
                  <td className={tdClass}>{p.project}</td>
                  <td className={`${tdClass} text-right`}>{formatHours(p.hours)}</td>
                  <td className={`${tdClass} text-right font-medium text-stone-900 dark:text-stone-100`}>{formatDKK(p.revenue)} kr.</td>
                  <td className={`${tdClass} text-right`}>{totalRevenue > 0 ? `${((p.revenue / totalRevenue) * 100).toFixed(1)}%` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mb-8">
          <h3 className="text-sm font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-3">Resource Breakdown</h3>
          <table className="w-full text-sm border border-stone-200 dark:border-white/[0.10] rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-stone-50 dark:bg-white/[0.03]">
                <th className={thClass}>Resource</th>
                <th className={`${thClass} text-right`}>Hours</th>
                <th className={`${thClass} text-right`}>Revenue</th>
                <th className={`${thClass} text-right`}>Avg Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-white/[0.06]">
              {resourceSummary.map(r => (
                <tr key={r.resource}>
                  <td className={`${tdClass} font-medium text-stone-900 dark:text-stone-100`}>{r.resource}</td>
                  <td className={`${tdClass} text-right`}>{formatHours(r.hours)}</td>
                  <td className={`${tdClass} text-right font-medium text-stone-900 dark:text-stone-100`}>{formatDKK(r.revenue)} kr.</td>
                  <td className={`${tdClass} text-right`}>{r.hours > 0 ? `${formatDKK(Math.round(r.revenue / r.hours))} kr.` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t border-stone-200 dark:border-white/[0.06] pt-4 text-xs text-stone-500 dark:text-stone-400 flex justify-between">
          <span>Generated {new Date().toLocaleDateString('da-DK')}</span>
          <span>Kyodo ApS - Business Intelligence</span>
        </div>
      </div>
    </div>
  );
}
