'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  ComposedChart, BarChart, Line, Area, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { getISOWeek, getISOWeekYear, startOfISOWeek, endOfISOWeek, setISOWeek, setISOWeekYear, format } from 'date-fns';
import { useFilters } from '@/lib/filter-context';
import { useTheme } from '@/context/ThemeContext';
import { Icon } from '@/components/Icon';
import chevronLeft from 'lucide-static/icons/chevron-left.svg';
import chevronRight from 'lucide-static/icons/chevron-right.svg';
import arrowUpDown from 'lucide-static/icons/arrow-up-down.svg';
import download from 'lucide-static/icons/download.svg';
import { formatDKK, formatHours, formatRate, getWeekLabel, getMonthLabelFull } from '@/lib/date-utils';
import { getEntriesForWeek, getEntriesForMonth, sumHours, sumDKK, avgRate } from '@/lib/calculations';
import type { ProjectBudgetSummary } from '@/lib/types';

// ── Helpers ────────────────────────────────────────────────────────

function getWeekYear(year: number, week: number, delta: number): { year: number; week: number } {
  let w = week + delta;
  let y = year;
  // Max ISO weeks in a year is 52 or 53
  const maxWeek = getISOWeek(new Date(y, 11, 28)); // Dec 28 always in last ISO week
  if (w > maxWeek) { w = 1; y++; }
  if (w < 1) { y--; w = getISOWeek(new Date(y, 11, 28)); }
  return { year: y, week: w };
}

function isoWeekToDate(year: number, week: number): Date {
  return startOfISOWeek(setISOWeek(setISOWeekYear(new Date(), year), week));
}

function getWeekDateRange(year: number, week: number): string {
  const refDate = isoWeekToDate(year, week);
  const end = endOfISOWeek(refDate);
  return `${format(refDate, 'd MMM')} – ${format(end, 'd MMM yyyy')}`;
}

function matchProjectName(entryProject: string, budgetTitle: string): boolean {
  const a = entryProject.toLowerCase().trim();
  const b = budgetTitle.toLowerCase().trim();
  return a === b || a.includes(b) || b.includes(a);
}

// ── Tooltip ────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-[#1e1e20] rounded-lg shadow-lg border border-stone-200 dark:border-white/[0.10] p-3 text-sm">
      <p className="font-medium text-stone-900 dark:text-stone-100 mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-stone-700 dark:text-stone-300">
          {entry.name}: {entry.name?.includes('Hours') ? formatHours(entry.value) : `${formatDKK(entry.value)} kr.`}
        </p>
      ))}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────

export function ProjectEconomyReport() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const { filteredEntries, filters } = useFilters();

  // Period mode: weekly or monthly
  const [periodMode, setPeriodMode] = useState<'weekly' | 'monthly'>('weekly');

  // Week selector state
  const now = new Date();
  const [selectedWeek, setSelectedWeek] = useState(getISOWeek(now));
  const [selectedYear, setSelectedYear] = useState(getISOWeekYear(now));
  const [showDKKCharts, setShowDKKCharts] = useState(false);

  // Month selector state
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedMonthYear, setSelectedMonthYear] = useState(now.getFullYear());

  // Budget data from API
  const [budgetData, setBudgetData] = useState<ProjectBudgetSummary[]>([]);
  const [budgetLoading, setBudgetLoading] = useState(true);
  const [budgetError, setBudgetError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/project-budgets')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => setBudgetData(data.summaries ?? []))
      .catch(err => setBudgetError(err.message))
      .finally(() => setBudgetLoading(false));
  }, []);

  // Navigate weeks
  const goWeek = (delta: number) => {
    const next = getWeekYear(selectedYear, selectedWeek, delta);
    setSelectedYear(next.year);
    setSelectedWeek(next.week);
  };

  // Navigate months
  const goMonth = (delta: number) => {
    let m = selectedMonth + delta;
    let y = selectedMonthYear;
    if (m > 12) { m = 1; y++; }
    if (m < 1) { m = 12; y--; }
    setSelectedMonth(m);
    setSelectedMonthYear(y);
  };

  // Match selected project filter to budget data
  const selectedProject = filters.projects.length === 1 ? filters.projects[0] : null;

  const matchedBudget = useMemo(() => {
    if (!selectedProject || !budgetData.length) return null;
    return budgetData.find(b => matchProjectName(selectedProject, b.projectTitle)) ?? null;
  }, [selectedProject, budgetData]);

  // Project entries (all time for this project)
  const projectEntries = useMemo(() => {
    if (!selectedProject) return [];
    return filteredEntries;
  }, [filteredEntries, selectedProject]);

  // This week entries
  const weekEntries = useMemo(() => {
    return getEntriesForWeek(projectEntries, selectedYear, selectedWeek);
  }, [projectEntries, selectedYear, selectedWeek]);

  // This month entries
  const monthEntries = useMemo(() => {
    return getEntriesForMonth(projectEntries, selectedMonthYear, selectedMonth);
  }, [projectEntries, selectedMonthYear, selectedMonth]);

  // Grand total actuals
  const totalActualHours = sumHours(projectEntries);
  const totalActualDKK = sumDKK(projectEntries);
  const totalActualRate = avgRate(projectEntries);

  // Hourly detail table state
  type SortKey = 'date' | 'resource' | 'hours' | 'totalDKK' | 'rate';
  const [hourSortKey, setHourSortKey] = useState<SortKey>('date');
  const [hourSortAsc, setHourSortAsc] = useState(false);
  const [hourSearch, setHourSearch] = useState('');

  const sortedEntries = useMemo(() => {
    let entries = [...projectEntries];
    if (hourSearch) {
      const q = hourSearch.toLowerCase();
      entries = entries.filter(e =>
        e.resource.toLowerCase().includes(q) || e.description.toLowerCase().includes(q) ||
        e.activity.toLowerCase().includes(q)
      );
    }
    entries.sort((a, b) => {
      let cmp = 0;
      switch (hourSortKey) {
        case 'date': cmp = a.date.localeCompare(b.date); break;
        case 'resource': cmp = a.resource.localeCompare(b.resource); break;
        case 'hours': cmp = a.hours - b.hours; break;
        case 'totalDKK': cmp = a.totalDKK - b.totalDKK; break;
        case 'rate': cmp = a.rate - b.rate; break;
      }
      return hourSortAsc ? cmp : -cmp;
    });
    return entries;
  }, [projectEntries, hourSortKey, hourSortAsc, hourSearch]);

  const sortedTotalHours = useMemo(() => sortedEntries.reduce((s, e) => s + e.hours, 0), [sortedEntries]);
  const sortedTotalDKK = useMemo(() => sortedEntries.reduce((s, e) => s + e.totalDKK, 0), [sortedEntries]);

  function toggleHourSort(key: SortKey) {
    if (hourSortKey === key) setHourSortAsc(v => !v);
    else { setHourSortKey(key); setHourSortAsc(false); }
  }

  function exportCSV() {
    const headers = ['Date', 'Activity', 'Resource', 'Description', 'Hours', 'Rate', 'Total DKK'];
    const rows = sortedEntries.map(e => [
      e.date, e.activity, e.resource,
      `"${e.description.replace(/"/g, '""')}"`, e.hours, e.rate, e.totalDKK,
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kyodo-hours-${selectedProject?.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Period actuals (week or month depending on mode)
  const periodEntries = periodMode === 'weekly' ? weekEntries : monthEntries;
  const periodHours = sumHours(periodEntries);
  const periodDKK = sumDKK(periodEntries);
  const periodRate = avgRate(periodEntries);

  // 9-week trend data (selectedWeek-4 to selectedWeek+4)
  const trendData = useMemo(() => {
    const weeks: { year: number; week: number }[] = [];
    for (let i = -4; i <= 4; i++) {
      weeks.push(getWeekYear(selectedYear, selectedWeek, i));
    }

    let cumActualHours = 0;
    let cumActualDKK = 0;
    let cumBudgetHours = 0;
    let cumBudgetDKK = 0;

    // Even budget distribution: spread total budget evenly across all project weeks
    const totalWeeks = matchedBudget?.weeklyBudgets.length || 1;
    const evenBudgetHours = (matchedBudget?.totalBudgetHours ?? 0) / totalWeeks;
    const evenBudgetDKK = (matchedBudget?.totalBudgetAmount ?? 0) / totalWeeks;

    // Compute accumulated from project start up to first trend week
    const firstWeek = weeks[0];
    for (const e of projectEntries) {
      const eYear = parseInt(e.date.slice(0, 4));
      if (eYear < firstWeek.year || (eYear === firstWeek.year && e.week < firstWeek.week)) {
        cumActualHours += e.hours;
        cumActualDKK += e.totalDKK;
      }
    }
    if (matchedBudget) {
      // Count how many project weeks fall before our trend window
      const weeksBefore = matchedBudget.weeklyBudgets.filter(
        wb => wb.year < firstWeek.year || (wb.year === firstWeek.year && wb.week < firstWeek.week)
      ).length;
      cumBudgetHours += evenBudgetHours * weeksBefore;
      cumBudgetDKK += evenBudgetDKK * weeksBefore;
    }

    return weeks.map(({ year, week }) => {
      const wEntries = getEntriesForWeek(projectEntries, year, week);
      const actualHours = sumHours(wEntries);
      const actualDKK = sumDKK(wEntries);

      // Use even distribution instead of per-week task-based budget
      const isProjectWeek = matchedBudget?.weeklyBudgets.some(w => w.year === year && w.week === week);
      const budgetHours = isProjectWeek ? evenBudgetHours : 0;
      const budgetDKK = isProjectWeek ? evenBudgetDKK : 0;

      cumActualHours += actualHours;
      cumActualDKK += actualDKK;
      cumBudgetHours += budgetHours;
      cumBudgetDKK += budgetDKK;

      return {
        label: `W${week}`,
        year,
        week,
        actualHours,
        budgetHours,
        diffHours: actualHours - budgetHours,
        actualDKK,
        budgetDKK,
        diffDKK: actualDKK - budgetDKK,
        cumActualHours,
        cumBudgetHours,
        cumActualDKK,
        cumBudgetDKK,
        isCurrent: year === selectedYear && week === selectedWeek,
      };
    });
  }, [projectEntries, matchedBudget, selectedYear, selectedWeek]);

  // 5-month trend data (selectedMonth-2 to selectedMonth+2) for monthly mode
  const monthlyTrendData = useMemo(() => {
    const months: { year: number; month: number }[] = [];
    for (let i = -2; i <= 2; i++) {
      let m = selectedMonth + i;
      let y = selectedMonthYear;
      while (m > 12) { m -= 12; y++; }
      while (m < 1) { m += 12; y--; }
      months.push({ year: y, month: m });
    }

    // Even monthly budget: total budget / total project months
    const totalProjectMonths = matchedBudget ? (() => {
      const monthSet = new Set<string>();
      for (const wb of matchedBudget.weeklyBudgets) {
        const d = isoWeekToDate(wb.year, wb.week);
        monthSet.add(`${d.getFullYear()}-${d.getMonth() + 1}`);
      }
      return Math.max(monthSet.size, 1);
    })() : 1;
    const evenMonthBudgetHours = (matchedBudget?.totalBudgetHours ?? 0) / totalProjectMonths;
    const evenMonthBudgetDKK = (matchedBudget?.totalBudgetAmount ?? 0) / totalProjectMonths;

    let cumActualHours = 0;
    let cumActualDKK = 0;
    let cumBudgetHours = 0;
    let cumBudgetDKK = 0;

    // Accumulate from before first trend month
    const first = months[0];
    for (const e of projectEntries) {
      const eYear = parseInt(e.date.slice(0, 4));
      const eMonth = parseInt(e.date.slice(5, 7));
      if (eYear < first.year || (eYear === first.year && eMonth < first.month)) {
        cumActualHours += e.hours;
        cumActualDKK += e.totalDKK;
      }
    }
    // Count budget months before first trend month
    if (matchedBudget) {
      const monthSet = new Set<string>();
      for (const wb of matchedBudget.weeklyBudgets) {
        const d = isoWeekToDate(wb.year, wb.week);
        const mKey = `${d.getFullYear()}-${d.getMonth() + 1}`;
        if (d.getFullYear() < first.year || (d.getFullYear() === first.year && d.getMonth() + 1 < first.month)) {
          monthSet.add(mKey);
        }
      }
      cumBudgetHours += evenMonthBudgetHours * monthSet.size;
      cumBudgetDKK += evenMonthBudgetDKK * monthSet.size;
    }

    return months.map(({ year, month }) => {
      const mEntries = getEntriesForMonth(projectEntries, year, month);
      const actualHours = sumHours(mEntries);
      const actualDKK = sumDKK(mEntries);

      // Check if this month falls within the project budget range
      const hasProjectActivity = matchedBudget?.weeklyBudgets.some(wb => {
        const d = isoWeekToDate(wb.year, wb.week);
        return d.getFullYear() === year && d.getMonth() + 1 === month;
      });
      const budgetHours = hasProjectActivity ? evenMonthBudgetHours : 0;
      const budgetDKK = hasProjectActivity ? evenMonthBudgetDKK : 0;

      cumActualHours += actualHours;
      cumActualDKK += actualDKK;
      cumBudgetHours += budgetHours;
      cumBudgetDKK += budgetDKK;

      return {
        label: `${getMonthLabelFull(month).slice(0, 3)} ${year}`,
        year,
        month,
        actualHours,
        budgetHours,
        diffHours: actualHours - budgetHours,
        actualDKK,
        budgetDKK,
        diffDKK: actualDKK - budgetDKK,
        cumActualHours,
        cumBudgetHours,
        cumActualDKK,
        cumBudgetDKK,
        isCurrent: year === selectedMonthYear && month === selectedMonth,
      };
    });
  }, [projectEntries, matchedBudget, selectedMonth, selectedMonthYear]);

  // Use the right trend data based on period mode
  const activeTrendData = periodMode === 'weekly' ? trendData : monthlyTrendData;

  // Chart colors
  const gridColor = isDark ? '#262626' : '#f5f5f4';
  const textColor = isDark ? '#a8a29e' : '#6b7280';
  const primaryColor = isDark ? '#e5e5e5' : '#292524';
  const secondaryColor = isDark ? '#525252' : '#d6d3d1';
  const accentColor = '#6366f1';

  const thClass = "px-3 py-2 text-left text-xs text-stone-500 dark:text-stone-400 uppercase tracking-wider";
  const tdClass = "px-3 py-1.5 text-sm text-stone-700 dark:text-stone-300";
  const currentWeekClass = "bg-indigo-50/70 dark:bg-indigo-900/20 font-semibold";

  // ── Prompt state ──

  if (!selectedProject) {
    return (
      <div className="px-6 py-12 text-center">
        <p className="text-stone-500 dark:text-stone-400 text-sm">
          Select a single project in the filter bar to view the Project Economy report.
        </p>
      </div>
    );
  }

  if (budgetLoading) {
    return (
      <div className="px-6 py-12 text-center">
        <div className="animate-pulse text-stone-400">Loading budget data...</div>
      </div>
    );
  }

  if (budgetError) {
    return (
      <div className="px-6 py-12 text-center">
        <p className="text-red-500 text-sm">Failed to load budget data: {budgetError}</p>
      </div>
    );
  }

  const hasBudget = matchedBudget && matchedBudget.totalBudgetHours > 0;

  // Donut gauge data
  const totalHoursPct = hasBudget ? (totalActualHours / matchedBudget!.totalBudgetHours) * 100 : 0;
  const donutPct = Math.min(totalHoursPct, 100);
  const donutData = [{ value: donutPct }, { value: 100 - donutPct }];
  const donutColor = totalHoursPct > 100 ? '#ef4444' : '#22c55e';
  const donutTrack = isDark ? '#2a2a2c' : '#f3f4f6';
  const remainingHours = hasBudget ? Math.max(0, matchedBudget!.totalBudgetHours - totalActualHours) : 0;

  const periodLabel = periodMode === 'weekly'
    ? `${getWeekLabel(selectedWeek)} — ${selectedYear}`
    : `${getMonthLabelFull(selectedMonth)} ${selectedMonthYear}`;

  return (
    <div className="space-y-8">
      {/* Period mode toggle + selector */}
      <div className="no-print flex flex-col items-center gap-3">
        <div className="flex h-8 rounded-lg border border-stone-200 dark:border-white/[0.10] overflow-hidden">
          {(['weekly', 'monthly'] as const).map(mode => (
            <button key={mode} onClick={() => setPeriodMode(mode)}
              className={`px-3 text-xs font-medium transition-colors ${periodMode === mode
                ? 'bg-stone-900 dark:bg-stone-700 text-white'
                : 'bg-white dark:bg-transparent text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-white/[0.04]'
              }`}
            >
              {mode === 'weekly' ? 'Weekly' : 'Monthly'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <button onClick={() => periodMode === 'weekly' ? goWeek(-1) : goMonth(-1)} className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-white/[0.06] transition-colors">
            <Icon src={chevronLeft} className="size-4 text-stone-600 dark:text-stone-400" />
          </button>
          <div className="text-center min-w-[200px]">
            <span className="text-sm font-medium text-stone-900 dark:text-stone-100">
              {periodLabel}
            </span>
            {periodMode === 'weekly' && (
              <p className="text-xs text-stone-500 dark:text-stone-400">
                {getWeekDateRange(selectedYear, selectedWeek)}
              </p>
            )}
          </div>
          <button onClick={() => periodMode === 'weekly' ? goWeek(1) : goMonth(1)} className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-white/[0.06] transition-colors">
            <Icon src={chevronRight} className="size-4 text-stone-600 dark:text-stone-400" />
          </button>
        </div>
      </div>

      {!hasBudget && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/30 rounded-lg p-3 text-sm text-amber-800 dark:text-amber-300">
          No budget data found for &ldquo;{selectedProject}&rdquo;. Showing actuals only.
        </div>
      )}

      {/* ── Section A: This Period ─────────────────────────────── */}
      <section>
        <h3 className="text-sm font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-4">
          {periodMode === 'weekly' ? `This Week — ${getWeekLabel(selectedWeek)}` : `This Month — ${getMonthLabelFull(selectedMonth)}`}
        </h3>
        <div className="bg-white dark:bg-[#161618] rounded-xl border border-stone-200 dark:border-white/[0.10] p-4 max-w-sm">
          <h4 className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase mb-3">Consumption</h4>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-stone-100 dark:divide-white/[0.06]">
              <tr><td className="py-1.5 text-stone-500 dark:text-stone-400">Spent Hours</td><td className="py-1.5 text-right font-medium text-stone-900 dark:text-stone-100">{formatHours(periodHours)}</td></tr>
              <tr><td className="py-1.5 text-stone-500 dark:text-stone-400">Spent DKK</td><td className="py-1.5 text-right font-medium text-stone-900 dark:text-stone-100">{formatDKK(periodDKK)} kr.</td></tr>
              <tr><td className="py-1.5 text-stone-500 dark:text-stone-400">Avg Rate</td><td className="py-1.5 text-right text-stone-700 dark:text-stone-300">{periodRate > 0 ? `${formatRate(periodRate)} kr.` : '—'}</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Section B: Grand Total ───────────────────────────── */}
      <section>
        <h3 className="text-sm font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-4">
          Grand Total — Project to Date
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Key figures */}
          <div className="bg-white dark:bg-[#161618] rounded-xl border border-stone-200 dark:border-white/[0.10] p-4">
            <h4 className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase mb-3">Key Figures</h4>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-stone-100 dark:divide-white/[0.06]">
                <tr><td className="py-1.5 text-stone-500 dark:text-stone-400">Spent Hours</td><td className="py-1.5 text-right font-medium text-stone-900 dark:text-stone-100">{formatHours(totalActualHours)}</td></tr>
                <tr><td className="py-1.5 text-stone-500 dark:text-stone-400">Budget Hours</td><td className="py-1.5 text-right text-stone-700 dark:text-stone-300">{hasBudget ? formatHours(matchedBudget!.totalBudgetHours) : '—'}</td></tr>
                <tr><td className="py-1.5 text-stone-500 dark:text-stone-400">Spent DKK</td><td className="py-1.5 text-right font-medium text-stone-900 dark:text-stone-100">{formatDKK(totalActualDKK)} kr.</td></tr>
                <tr><td className="py-1.5 text-stone-500 dark:text-stone-400">Budget DKK</td><td className="py-1.5 text-right text-stone-700 dark:text-stone-300">{hasBudget ? `${formatDKK(matchedBudget!.totalBudgetAmount)} kr.` : '—'}</td></tr>
                <tr><td className="py-1.5 text-stone-500 dark:text-stone-400">Avg Rate</td><td className="py-1.5 text-right text-stone-700 dark:text-stone-300">{totalActualRate > 0 ? `${formatRate(totalActualRate)} kr.` : '—'}</td></tr>
                <tr><td className="py-1.5 text-stone-500 dark:text-stone-400">Remaining Hours</td><td className="py-1.5 text-right text-stone-700 dark:text-stone-300">{hasBudget ? formatHours(Math.max(0, matchedBudget!.totalBudgetHours - totalActualHours)) : '—'}</td></tr>
              </tbody>
            </table>
          </div>

          {/* Donut gauge */}
          <div className="bg-white dark:bg-[#161618] rounded-xl border border-stone-200 dark:border-white/[0.10] p-4 flex flex-col items-center justify-center">
            {hasBudget ? (
              <>
                <div className="relative w-44 h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={donutData} cx="50%" cy="50%" startAngle={90} endAngle={-270} innerRadius="70%" outerRadius="95%" dataKey="value" stroke="none">
                        <Cell fill={donutColor} />
                        <Cell fill={donutTrack} />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-3xl font-bold text-stone-900 dark:text-stone-100">{Math.round(totalHoursPct)}%</p>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400">Hours used</p>
                  </div>
                </div>
                <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
                  Remaining: <span className="font-medium text-stone-700 dark:text-stone-300">{formatHours(remainingHours)} hrs</span>
                </p>
              </>
            ) : (
              <p className="text-sm text-stone-400">No budget data</p>
            )}
          </div>

          {/* Bar chart */}
          <div className="bg-white dark:bg-[#161618] rounded-xl border border-stone-200 dark:border-white/[0.10] p-4">
            <h4 className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase mb-3">Total Comparison</h4>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { name: 'Hours', spent: totalActualHours, budget: hasBudget ? matchedBudget!.totalBudgetHours : 0 },
                    { name: 'DKK (K)', spent: totalActualDKK / 1000, budget: hasBudget ? matchedBudget!.totalBudgetAmount / 1000 : 0 },
                  ]}
                  margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                  barGap={4}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: textColor }} />
                  <YAxis tick={{ fontSize: 11, fill: textColor }} width={40} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} formatter={(value: string) => <span style={{ color: textColor }}>{value}</span>} />
                  <Bar dataKey="spent" name="Spent" fill={primaryColor} radius={[4, 4, 0, 0]} barSize={28} />
                  <Bar dataKey="budget" name="Budget" fill={secondaryColor} radius={[4, 4, 0, 0]} barSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section C: 9-Week Overview ───────────────────────── */}
      <section className="print-page-break">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">
            Overview — {periodMode === 'weekly' ? `${getWeekLabel(selectedWeek)} (±4 weeks)` : `${getMonthLabelFull(selectedMonth)} (±2 months)`}
          </h3>
          <button
            onClick={() => setShowDKKCharts(v => !v)}
            className="no-print text-xs px-3 py-1.5 rounded-lg border border-stone-200 dark:border-white/[0.10] text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-white/[0.04] transition-colors"
          >
            {showDKKCharts ? 'Hide DKK charts' : 'Show DKK charts'}
          </button>
        </div>

        {/* Actual vs Budget - Hours */}
        <div className="bg-white dark:bg-[#161618] rounded-xl border border-stone-200 dark:border-white/[0.10] p-5 mb-4 print-break-inside-avoid">
          <h4 className="text-sm font-medium text-stone-900 dark:text-stone-100 mb-4">Actual vs Budget — Hours</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={activeTrendData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: textColor }} />
                <YAxis tick={{ fontSize: 11, fill: textColor }} width={40} />
                <Tooltip content={<ChartTooltip />} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} formatter={(value: string) => <span style={{ color: textColor }}>{value}</span>} />
                <Line dataKey="actualHours" name="Actual Hours" stroke={primaryColor} strokeWidth={2.5} dot={{ r: 3, fill: primaryColor, strokeWidth: 0 }} type="monotone" />
                <Line dataKey="budgetHours" name="Budget Hours" stroke={secondaryColor} strokeWidth={2} strokeDasharray="6 3" dot={{ r: 3, fill: secondaryColor, strokeWidth: 0 }} type="monotone" />
                <Line dataKey="diffHours" name="Diff Hours" stroke={accentColor} strokeWidth={1.5} dot={{ r: 3, fill: accentColor, strokeWidth: 0 }} type="monotone" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          {/* Data table */}
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-xs border border-stone-200 dark:border-white/[0.10] rounded overflow-hidden">
              <thead>
                <tr className="bg-stone-50 dark:bg-white/[0.03]">
                  <th className={thClass}>{periodMode === 'weekly' ? 'Week' : 'Month'}</th>
                  {activeTrendData.map(d => (
                    <th key={d.label} className={`${thClass} text-right ${d.isCurrent ? `${currentWeekClass} text-stone-900 dark:text-stone-100` : ''}`}>{d.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-white/[0.06]">
                <tr>
                  <td className={`${tdClass} font-medium`}>Actual</td>
                  {activeTrendData.map(d => <td key={d.label} className={`${tdClass} text-right ${d.isCurrent ? currentWeekClass : ''}`}>{formatHours(d.actualHours)}</td>)}
                </tr>
                <tr>
                  <td className={`${tdClass} font-medium`}>Budget</td>
                  {activeTrendData.map(d => <td key={d.label} className={`${tdClass} text-right ${d.isCurrent ? currentWeekClass : ''}`}>{formatHours(d.budgetHours)}</td>)}
                </tr>
                <tr>
                  <td className={`${tdClass} font-medium`}>Diff</td>
                  {activeTrendData.map(d => (
                    <td key={d.label} className={`${tdClass} text-right ${d.isCurrent ? currentWeekClass : ''} ${d.diffHours > 0 ? 'text-red-500' : d.diffHours < 0 ? 'text-green-600 dark:text-green-400' : ''}`}>
                      {d.diffHours > 0 ? '+' : ''}{formatHours(d.diffHours)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Accumulated - Hours */}
        <div className="bg-white dark:bg-[#161618] rounded-xl border border-stone-200 dark:border-white/[0.10] p-5 mb-4 print-break-inside-avoid">
          <h4 className="text-sm font-medium text-stone-900 dark:text-stone-100 mb-4">Accumulated — Hours</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={activeTrendData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="cumActualFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={primaryColor} stopOpacity={0.15} />
                    <stop offset="100%" stopColor={primaryColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: textColor }} />
                <YAxis tick={{ fontSize: 11, fill: textColor }} width={50} />
                <Tooltip content={<ChartTooltip />} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} formatter={(value: string) => <span style={{ color: textColor }}>{value}</span>} />
                <Area dataKey="cumActualHours" name="Actual Acc. Hours" stroke={primaryColor} strokeWidth={2.5} fill="url(#cumActualFill)" dot={{ r: 3, fill: primaryColor, strokeWidth: 0 }} type="monotone" />
                <Line dataKey="cumBudgetHours" name="Budget Acc. Hours" stroke={secondaryColor} strokeWidth={2} strokeDasharray="6 3" dot={{ r: 3, fill: secondaryColor, strokeWidth: 0 }} type="monotone" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          {/* Data table */}
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-xs border border-stone-200 dark:border-white/[0.10] rounded overflow-hidden">
              <thead>
                <tr className="bg-stone-50 dark:bg-white/[0.03]">
                  <th className={thClass}>{periodMode === 'weekly' ? 'Week' : 'Month'}</th>
                  {activeTrendData.map(d => (
                    <th key={d.label} className={`${thClass} text-right ${d.isCurrent ? `${currentWeekClass} text-stone-900 dark:text-stone-100` : ''}`}>{d.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-white/[0.06]">
                <tr>
                  <td className={`${tdClass} font-medium`}>Actual</td>
                  {activeTrendData.map(d => <td key={d.label} className={`${tdClass} text-right ${d.isCurrent ? currentWeekClass : ''}`}>{formatHours(d.cumActualHours)}</td>)}
                </tr>
                <tr>
                  <td className={`${tdClass} font-medium`}>Budget</td>
                  {activeTrendData.map(d => <td key={d.label} className={`${tdClass} text-right ${d.isCurrent ? currentWeekClass : ''}`}>{formatHours(d.cumBudgetHours)}</td>)}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Actual vs Budget - DKK (toggleable) */}
        {showDKKCharts && (
        <div className="bg-white dark:bg-[#161618] rounded-xl border border-stone-200 dark:border-white/[0.10] p-5 mb-4 print-break-inside-avoid">
          <h4 className="text-sm font-medium text-stone-900 dark:text-stone-100 mb-4">Actual vs Budget — DKK</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={activeTrendData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: textColor }} />
                <YAxis tick={{ fontSize: 11, fill: textColor }} tickFormatter={v => `${(v / 1000).toFixed(0)}K`} width={50} />
                <Tooltip content={<ChartTooltip />} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} formatter={(value: string) => <span style={{ color: textColor }}>{value}</span>} />
                <Line dataKey="actualDKK" name="Actual DKK" stroke={primaryColor} strokeWidth={2.5} dot={{ r: 3, fill: primaryColor, strokeWidth: 0 }} type="monotone" />
                <Line dataKey="budgetDKK" name="Budget DKK" stroke={secondaryColor} strokeWidth={2} strokeDasharray="6 3" dot={{ r: 3, fill: secondaryColor, strokeWidth: 0 }} type="monotone" />
                <Line dataKey="diffDKK" name="Diff DKK" stroke={accentColor} strokeWidth={1.5} dot={{ r: 3, fill: accentColor, strokeWidth: 0 }} type="monotone" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          {/* Data table */}
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-xs border border-stone-200 dark:border-white/[0.10] rounded overflow-hidden">
              <thead>
                <tr className="bg-stone-50 dark:bg-white/[0.03]">
                  <th className={thClass}>{periodMode === 'weekly' ? 'Week' : 'Month'}</th>
                  {activeTrendData.map(d => (
                    <th key={d.label} className={`${thClass} text-right ${d.isCurrent ? `${currentWeekClass} text-stone-900 dark:text-stone-100` : ''}`}>{d.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-white/[0.06]">
                <tr>
                  <td className={`${tdClass} font-medium`}>Actual</td>
                  {activeTrendData.map(d => <td key={d.label} className={`${tdClass} text-right ${d.isCurrent ? currentWeekClass : ''}`}>{formatDKK(d.actualDKK)}</td>)}
                </tr>
                <tr>
                  <td className={`${tdClass} font-medium`}>Budget</td>
                  {activeTrendData.map(d => <td key={d.label} className={`${tdClass} text-right ${d.isCurrent ? currentWeekClass : ''}`}>{formatDKK(d.budgetDKK)}</td>)}
                </tr>
                <tr>
                  <td className={`${tdClass} font-medium`}>Diff</td>
                  {activeTrendData.map(d => (
                    <td key={d.label} className={`${tdClass} text-right ${d.isCurrent ? currentWeekClass : ''} ${d.diffDKK > 0 ? 'text-red-500' : d.diffDKK < 0 ? 'text-green-600 dark:text-green-400' : ''}`}>
                      {d.diffDKK > 0 ? '+' : ''}{formatDKK(d.diffDKK)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        )}

        {/* Accumulated - DKK (toggleable) */}
        {showDKKCharts && (
        <div className="bg-white dark:bg-[#161618] rounded-xl border border-stone-200 dark:border-white/[0.10] p-5 print-break-inside-avoid">
          <h4 className="text-sm font-medium text-stone-900 dark:text-stone-100 mb-4">Accumulated — DKK</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={activeTrendData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="cumActualDKKFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={primaryColor} stopOpacity={0.15} />
                    <stop offset="100%" stopColor={primaryColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: textColor }} />
                <YAxis tick={{ fontSize: 11, fill: textColor }} tickFormatter={v => `${(v / 1000).toFixed(0)}K`} width={50} />
                <Tooltip content={<ChartTooltip />} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} formatter={(value: string) => <span style={{ color: textColor }}>{value}</span>} />
                <Area dataKey="cumActualDKK" name="Actual Acc. DKK" stroke={primaryColor} strokeWidth={2.5} fill="url(#cumActualDKKFill)" dot={{ r: 3, fill: primaryColor, strokeWidth: 0 }} type="monotone" />
                <Line dataKey="cumBudgetDKK" name="Budget Acc. DKK" stroke={secondaryColor} strokeWidth={2} strokeDasharray="6 3" dot={{ r: 3, fill: secondaryColor, strokeWidth: 0 }} type="monotone" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          {/* Data table */}
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-xs border border-stone-200 dark:border-white/[0.10] rounded overflow-hidden">
              <thead>
                <tr className="bg-stone-50 dark:bg-white/[0.03]">
                  <th className={thClass}>{periodMode === 'weekly' ? 'Week' : 'Month'}</th>
                  {activeTrendData.map(d => (
                    <th key={d.label} className={`${thClass} text-right ${d.isCurrent ? `${currentWeekClass} text-stone-900 dark:text-stone-100` : ''}`}>{d.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-white/[0.06]">
                <tr>
                  <td className={`${tdClass} font-medium`}>Actual</td>
                  {activeTrendData.map(d => <td key={d.label} className={`${tdClass} text-right ${d.isCurrent ? currentWeekClass : ''}`}>{formatDKK(d.cumActualDKK)}</td>)}
                </tr>
                <tr>
                  <td className={`${tdClass} font-medium`}>Budget</td>
                  {activeTrendData.map(d => <td key={d.label} className={`${tdClass} text-right ${d.isCurrent ? currentWeekClass : ''}`}>{formatDKK(d.cumBudgetDKK)}</td>)}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        )}
      </section>

      {/* ── Section D: Hourly Detail ──────────────────────────── */}
      <section>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className="text-sm font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">
            Hourly Detail
          </h3>
          <div className="no-print flex items-center gap-3">
            <input
              type="text"
              placeholder="Search..."
              value={hourSearch}
              onChange={e => setHourSearch(e.target.value)}
              className="h-8 px-3 text-sm border border-stone-200 dark:border-white/[0.10] rounded-md bg-white dark:bg-[#161618] text-stone-900 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 w-48 placeholder:text-stone-400 dark:placeholder:text-stone-500"
            />
            <span className="text-xs text-stone-500 dark:text-stone-400">
              {sortedEntries.length} entries
            </span>
            <button onClick={exportCSV}
              className="h-8 px-3 text-xs font-medium text-white bg-stone-900 dark:bg-stone-700 rounded-lg hover:bg-stone-800 dark:hover:bg-stone-600 transition-colors flex items-center gap-1.5"
            >
              <Icon src={download} className="size-3" />
              CSV
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-[#161618] rounded-xl border border-stone-200 dark:border-white/[0.10] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-stone-50 dark:bg-white/[0.03] text-xs text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                  {([
                    { label: 'Date', field: 'date' as SortKey },
                    { label: 'Activity', field: null },
                    { label: 'Resource', field: 'resource' as SortKey },
                    { label: 'Description', field: null },
                    { label: 'Hours', field: 'hours' as SortKey, align: 'right' },
                    { label: 'Rate', field: 'rate' as SortKey, align: 'right' },
                    { label: 'Total DKK', field: 'totalDKK' as SortKey, align: 'right' },
                  ]).map(col => col.field ? (
                    <th key={col.label}
                      className={`px-4 py-2.5 cursor-pointer hover:text-stone-700 dark:hover:text-stone-200 select-none ${col.align === 'right' ? 'text-right' : 'text-left'}`}
                      onClick={() => toggleHourSort(col.field!)}
                    >
                      <span className="inline-flex items-center gap-1">
                        {col.label}
                        <Icon src={arrowUpDown} className={`size-3 ${hourSortKey === col.field ? 'text-stone-900 dark:text-stone-100' : 'text-stone-300 dark:text-stone-600'}`} />
                      </span>
                    </th>
                  ) : (
                    <th key={col.label} className="px-4 py-2.5 text-left">{col.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-white/[0.06]">
                {sortedEntries.slice(0, 500).map((e, i) => (
                  <tr key={i} className="hover:bg-stone-50 dark:hover:bg-white/[0.03]">
                    <td className="px-4 py-2 text-stone-600 dark:text-stone-400 whitespace-nowrap">{e.date}</td>
                    <td className="px-4 py-2 text-stone-500 dark:text-stone-400">{e.activity}</td>
                    <td className="px-4 py-2 text-stone-600 dark:text-stone-400">{e.resource}</td>
                    <td className="px-4 py-2 text-stone-500 dark:text-stone-400 max-w-[240px] truncate" title={e.description}>{e.description}</td>
                    <td className="px-4 py-2 text-right text-stone-700 dark:text-stone-300">{e.hours}</td>
                    <td className="px-4 py-2 text-right text-stone-500 dark:text-stone-400">{formatRate(e.rate)}</td>
                    <td className="px-4 py-2 text-right font-medium text-stone-900 dark:text-stone-100">{formatDKK(e.totalDKK)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-stone-50 dark:bg-white/[0.03] font-semibold border-t border-stone-200 dark:border-white/[0.06]">
                  <td className="px-4 py-2.5 text-stone-900 dark:text-stone-100" colSpan={4}>
                    Total ({sortedEntries.length} entries)
                  </td>
                  <td className="px-4 py-2.5 text-right text-stone-900 dark:text-stone-100">{formatHours(sortedTotalHours)}</td>
                  <td className="px-4 py-2.5 text-right text-stone-500 dark:text-stone-400">
                    {sortedTotalHours > 0 ? formatRate(sortedTotalDKK / sortedTotalHours) : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-right text-stone-900 dark:text-stone-100">{formatDKK(sortedTotalDKK)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          {sortedEntries.length > 500 && (
            <div className="px-5 py-3 text-sm text-stone-500 dark:text-stone-400 bg-stone-50 dark:bg-white/[0.03] border-t border-stone-200 dark:border-white/[0.06]">
              Showing first 500 of {sortedEntries.length} entries. Export CSV for full data.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
