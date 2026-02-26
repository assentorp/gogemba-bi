'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useData } from '@/lib/data-context';
import { useFilters } from '@/lib/filter-context';
import { FilterBar } from '@/components/filter-bar';
import { Icon } from '@/components/Icon';
import printer from 'lucide-static/icons/printer.svg';
import { formatDKK, formatHours, formatRate, getMonthLabelFull, getMonthLabel, getWeekLabel } from '@/lib/date-utils';
import { sumDKK, sumHours, avgRate, getEntriesForMonth, activeProjectCount } from '@/lib/calculations';
import { ProjectEconomyReport } from '@/components/reports/ProjectEconomyReport';

export default function ReportsPage() {
  const { data, loading, error } = useData();
  const { filteredEntries, selectedYear, selectedMonth, isAllTime, filters } = useFilters();
  const [reportMode, setReportMode] = useState<'monthly' | 'weekly' | 'project-economy'>('monthly');

  // Force light mode during print so dark backgrounds don't bleed through
  const handleBeforePrint = useCallback(() => {
    document.documentElement.classList.remove('dark');
    document.documentElement.style.colorScheme = 'light';
  }, []);
  const handleAfterPrint = useCallback(() => {
    const stored = localStorage.getItem('kyodo-bi-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (stored === 'dark' || (stored !== 'light' && prefersDark)) {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    }
  }, []);
  useEffect(() => {
    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);
    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, [handleBeforePrint, handleAfterPrint]);

  // Single-month entries (or all entries in all-time mode)
  const periodEntries = useMemo(() => isAllTime ? filteredEntries : getEntriesForMonth(filteredEntries, selectedYear, selectedMonth), [filteredEntries, selectedYear, selectedMonth, isAllTime]);

  const projectSummary = useMemo(() => {
    const map = new Map<string, { client: string; project: string; hours: number; revenue: number }>();
    for (const e of periodEntries) {
      const key = `${e.client}-${e.project}`;
      if (!map.has(key)) map.set(key, { client: e.client, project: e.project, hours: 0, revenue: 0 });
      const p = map.get(key)!;
      p.hours += e.hours;
      p.revenue += e.totalDKK;
    }
    return [...map.values()].sort((a, b) => b.revenue - a.revenue);
  }, [periodEntries]);

  // All-time: monthly breakdown; weekly mode: week breakdown; monthly mode: no breakdown needed
  const periodBreakdown = useMemo(() => {
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
      return [...map.values()].sort((a, b) => a.key.localeCompare(b.key));
    }
    if (reportMode === 'weekly') {
      const map = new Map<number, { week: number; label: string; hours: number; revenue: number }>();
      for (const e of periodEntries) {
        if (!map.has(e.week)) map.set(e.week, { week: e.week, label: getWeekLabel(e.week), hours: 0, revenue: 0 });
        const w = map.get(e.week)!;
        w.hours += e.hours;
        w.revenue += e.totalDKK;
      }
      return [...map.values()].sort((a, b) => a.week - b.week);
    }
    return [];
  }, [filteredEntries, periodEntries, selectedYear, selectedMonth, isAllTime, reportMode]);

  // Week range for subtitle
  const weekRange = useMemo(() => {
    if (isAllTime || reportMode !== 'weekly' || periodEntries.length === 0) return null;
    const weeks = [...new Set(periodEntries.map(e => e.week))].sort((a, b) => a - b);
    return { min: weeks[0], max: weeks[weeks.length - 1] };
  }, [periodEntries, isAllTime, reportMode]);

  const resourceSummary = useMemo(() => {
    const map = new Map<string, { resource: string; hours: number; revenue: number }>();
    for (const e of periodEntries) {
      if (!map.has(e.resource)) map.set(e.resource, { resource: e.resource, hours: 0, revenue: 0 });
      const r = map.get(e.resource)!;
      r.hours += e.hours;
      r.revenue += e.totalDKK;
    }
    return [...map.values()].sort((a, b) => b.revenue - a.revenue);
  }, [periodEntries]);

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-pulse text-stone-400">Loading...</div></div>;
  if (error || !data) return <div className="flex items-center justify-center h-screen"><div className="text-red-500">Error: {error}</div></div>;

  const totalHours = sumHours(periodEntries);
  const totalRevenue = sumDKK(periodEntries);
  const rate = avgRate(periodEntries);
  const projects = activeProjectCount(periodEntries);

  const thClass = "px-4 py-2.5 text-left text-xs text-stone-500 dark:text-stone-400 uppercase tracking-wider";
  const tdClass = "px-4 py-2 text-stone-700 dark:text-stone-300";

  return (
    <div className="bg-white dark:bg-[#0a0a0a]">
      <div className="no-print"><FilterBar /></div>

      <div className="p-6 no-print flex items-center gap-3">
        <button onClick={() => window.print()}
          className="h-9 px-4 text-sm font-medium text-white bg-stone-900 dark:bg-stone-700 rounded-lg hover:bg-stone-800 dark:hover:bg-stone-600 transition-colors flex items-center gap-2"
        >
          <Icon src={printer} className="size-3.5" />
          Print / Save as PDF
        </button>
        <div className="flex h-9 rounded-lg border border-stone-200 dark:border-white/[0.10] overflow-hidden">
          {([
            { key: 'monthly' as const, label: 'Monthly', hideAllTime: true },
            { key: 'weekly' as const, label: 'Weekly', hideAllTime: true },
            { key: 'project-economy' as const, label: 'Project Economy', hideAllTime: false },
          ]).filter(m => !isAllTime || !m.hideAllTime).map(mode => (
            <button key={mode.key} onClick={() => setReportMode(mode.key)}
              className={`px-3.5 text-sm font-medium transition-colors ${reportMode === mode.key
                ? 'bg-stone-900 dark:bg-stone-700 text-white'
                : 'bg-white dark:bg-transparent text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-white/[0.04]'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 pb-8 max-w-4xl mx-auto" id="report-content">
        {reportMode === 'project-economy' ? (
          <>
            <div className="border-b-2 border-stone-300 dark:border-stone-700 pb-4 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-stone-900 dark:text-stone-100">Project Economy Report</h2>
                  {filteredEntries.length > 0 && (
                    <p className="text-stone-500 dark:text-stone-400 mt-1">
                      {filteredEntries[0].client}{filters.projects.length === 1 ? ` — ${filters.projects[0]}` : ''}
                    </p>
                  )}
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/kyodo-logo-black.svg" alt="Kyodo Lab" className="h-5 dark:hidden" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/kyodo-logo-white.svg" alt="Kyodo Lab" className="h-5 hidden dark:block" />
              </div>
            </div>
            <ProjectEconomyReport />
          </>
        ) : (
        <>
        <div className="border-b-2 border-stone-300 dark:border-stone-700 pb-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-stone-900 dark:text-stone-100">
                {isAllTime ? 'Kyodo Report' : reportMode === 'weekly' ? 'Kyodo Weekly Report' : 'Kyodo Monthly Report'}
              </h2>
              <p className="text-stone-500 dark:text-stone-400 mt-1">Period: {
                isAllTime ? 'All Time'
                  : reportMode === 'weekly' && weekRange
                    ? `Week ${weekRange.min}–${weekRange.max}, ${getMonthLabelFull(selectedMonth)} ${selectedYear}`
                    : `${getMonthLabelFull(selectedMonth)} ${selectedYear}`
              }</p>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/kyodo-logo-black.svg" alt="Kyodo Lab" className="h-5 dark:hidden" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/kyodo-logo-white.svg" alt="Kyodo Lab" className="h-5 hidden dark:block" />
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-sm font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-3">Executive Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Revenue', value: `${formatDKK(totalRevenue)} kr.` },
              { label: 'Total Hours', value: formatHours(totalHours) },
              { label: 'Avg Rate', value: `${formatRate(rate)} kr.` },
              { label: 'Active Projects', value: String(projects) },
            ].map((card, i) => (
              <div key={i} className="bg-stone-50 dark:bg-white/[0.03] rounded-lg p-3">
                <p className="text-xs text-stone-500 dark:text-stone-400">{card.label}</p>
                <p className="text-xl font-semibold text-stone-900 dark:text-stone-100">{card.value}</p>
              </div>
            ))}
          </div>
        </div>

        {periodBreakdown.length > 0 && (
          <div className="mb-8">
            <h3 className="text-sm font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-3">
              {isAllTime ? 'Monthly Breakdown' : 'Weekly Breakdown'}
            </h3>
            <table className="w-full text-sm border border-stone-200 dark:border-white/[0.10] rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-stone-50 dark:bg-white/[0.03]">
                  <th className={thClass}>{isAllTime ? 'Month' : 'Week'}</th>
                  <th className={`${thClass} text-right`}>Hours</th>
                  <th className={`${thClass} text-right`}>Revenue</th>
                  <th className={`${thClass} text-right`}>Avg Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-white/[0.06]">
                {periodBreakdown.map((row, i) => (
                  <tr key={i}>
                    <td className={tdClass}>{row.label}</td>
                    <td className={`${tdClass} text-right`}>{formatHours(row.hours)}</td>
                    <td className={`${tdClass} text-right font-medium text-stone-900 dark:text-stone-100`}>{formatDKK(row.revenue)} kr.</td>
                    <td className={`${tdClass} text-right`}>{row.hours > 0 ? `${formatRate(row.revenue / row.hours)} kr.` : '—'}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-stone-50 dark:bg-white/[0.03] font-semibold border-t border-stone-200 dark:border-white/[0.06]">
                  <td className="px-4 py-2 text-stone-900 dark:text-stone-100">Total</td>
                  <td className="px-4 py-2 text-right text-stone-900 dark:text-stone-100">{formatHours(totalHours)}</td>
                  <td className="px-4 py-2 text-right text-stone-900 dark:text-stone-100">{formatDKK(totalRevenue)} kr.</td>
                  <td className="px-4 py-2 text-right text-stone-500 dark:text-stone-400">{totalHours > 0 ? `${formatRate(rate)} kr.` : '—'}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        <div className="mb-8">
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
        </>
        )}
      </div>
    </div>
  );
}
