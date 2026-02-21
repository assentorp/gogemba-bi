'use client';

import { useMemo } from 'react';
import { useData } from '@/lib/data-context';
import { useFilters } from '@/lib/filter-context';
import { FilterBar } from '@/components/filter-bar';
import { KPIBanner } from '@/components/dashboard/kpi-card';
import { MonthlyTurnoverChart, CumulativeChart } from '@/components/dashboard/monthly-chart';
import { BusinessAreaCard } from '@/components/dashboard/business-area-card';
import { BillingGauge } from '@/components/dashboard/billing-gauge';
import { StatsTable } from '@/components/dashboard/stats-table';
import { Icon } from '@/components/Icon';
import {
  computeKPIs,
  getMonthlyTurnoverData,
  getEntriesByBusinessArea,
  activeProjectCount,
  getEntriesYTD,
  sumDKK,
  sumHours,
  avgRate,
  getFTECount,
} from '@/lib/calculations';
import { formatDKK, getMonthLabelFull, getWorkingDaysInMonth, getWorkingDaysYTD } from '@/lib/date-utils';

export default function DashboardPage() {
  const { data, loading, error } = useData();
  const { filters, filteredEntries, selectedYear, selectedMonth, isAllTime } = useFilters();

  const kpi = useMemo(() => {
    if (!data) return null;
    if (isAllTime) return null; // handled separately
    return computeKPIs(filteredEntries, data.resources, selectedYear, selectedMonth);
  }, [data, filteredEntries, selectedYear, selectedMonth, isAllTime]);

  const allTimeStats = useMemo(() => {
    if (!isAllTime) return null;
    const totalRevenue = sumDKK(filteredEntries);
    const totalHours = sumHours(filteredEntries);
    const rate = avgRate(filteredEntries);
    const projects = activeProjectCount(filteredEntries);
    return { totalRevenue, totalHours, rate, projects };
  }, [filteredEntries, isAllTime]);

  const chartData = useMemo(() => {
    if (!data) return [];
    if (isAllTime) {
      // Build chart data across all years/months
      const monthMap = new Map<string, { label: string; turnover: number; sortKey: string }>();
      for (const e of filteredEntries) {
        const [y, m] = e.date.split('-');
        const key = `${y}-${m}`;
        if (!monthMap.has(key)) {
          const monthLabels = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          monthMap.set(key, { label: `${monthLabels[parseInt(m)]} ${y.slice(2)}`, turnover: 0, sortKey: key });
        }
        monthMap.get(key)!.turnover += e.totalDKK;
      }
      const sorted = [...monthMap.values()].sort((a, b) => a.sortKey.localeCompare(b.sortKey));
      let cumTurnover = 0;
      return sorted.map(s => {
        cumTurnover += s.turnover;
        return { month: 0, label: s.label, turnover: s.turnover, budget: 0, cumTurnover, cumBudget: 0 };
      });
    }
    return getMonthlyTurnoverData(filteredEntries, selectedYear);
  }, [data, filteredEntries, selectedYear, isAllTime]);

  const businessAreas = useMemo(() => {
    if (!data) return null;
    const entries = isAllTime ? filteredEntries : getEntriesYTD(filteredEntries, selectedYear, selectedMonth);
    return getEntriesByBusinessArea(entries);
  }, [data, filteredEntries, selectedYear, selectedMonth, isAllTime]);

  const ytdActiveProjects = useMemo(() => {
    if (!data) return 0;
    const entries = isAllTime ? filteredEntries : getEntriesYTD(filteredEntries, selectedYear, selectedMonth);
    return activeProjectCount(entries);
  }, [data, filteredEntries, selectedYear, selectedMonth, isAllTime]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse text-stone-400">Loading dashboard...</div>
      </div>
    );
  }

  if (error || !data || (!kpi && !allTimeStats)) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-red-500">Error loading data: {error}</div>
      </div>
    );
  }

  const monthLabel = getMonthLabelFull(selectedMonth);

  return (
    <div className="bg-white dark:bg-[#0a0a0a]">
      <FilterBar />

      <div className="p-6 space-y-5">
        {isAllTime && allTimeStats ? (
          <div className="bg-white dark:bg-[#161618] rounded-xl border border-stone-200 dark:border-white/[0.10] overflow-hidden">
            <div className="px-5 pt-4 pb-2">
              <p className="text-sm font-medium text-stone-900 dark:text-stone-100">{filters.dateFrom ? filters.dateFrom.slice(0, 4) : 'All Time'}</p>
              <p className="text-3xl font-semibold tracking-tight mt-1 text-stone-900 dark:text-stone-100">{formatDKK(allTimeStats.totalRevenue)} kr.</p>
            </div>
            <div className="flex divide-x divide-stone-200 dark:divide-white/[0.10] bg-stone-50 dark:bg-white/[0.03] px-5 py-2.5">
              <div className="flex-1">
                <p className="text-[11px] text-stone-500 dark:text-stone-400">Hours</p>
                <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">{allTimeStats.totalHours.toLocaleString('da-DK', { maximumFractionDigits: 1 })}</p>
              </div>
              <div className="flex-1 pl-4">
                <p className="text-[11px] text-stone-500 dark:text-stone-400">Avg Rate</p>
                <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">{formatDKK(Math.round(allTimeStats.rate))} kr.</p>
              </div>
              <div className="flex-1 pl-4">
                <p className="text-[11px] text-stone-500 dark:text-stone-400">Projects</p>
                <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">{allTimeStats.projects}</p>
              </div>
            </div>
          </div>
        ) : kpi ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <KPIBanner
              title={`${monthLabel} ${selectedYear} (MTD)`}
              value={`${formatDKK(kpi.turnoverMTD)} kr.`}
              items={[
                { label: 'Budget', value: `${formatDKK(kpi.budgetMTD)} kr.` },
                { label: 'FTE Budget', value: `${kpi.fteCount * 136.28 > 0 ? formatDKK(Math.round(kpi.fteCount * 136.28)) : '—'}` },
                { label: 'Delta', value: `${kpi.deltaMTD >= 0 ? '+' : ''}${formatDKK(kpi.deltaMTD)} kr.` },
              ]}
            />
            <KPIBanner
              title="YTD"
              value={`${formatDKK(kpi.turnoverYTD)} kr.`}
              badge={{ label: `${Math.round(kpi.indexYTD)}%`, positive: kpi.indexYTD >= 100 }}
              items={[
                { label: 'Budget YTD', value: `${formatDKK(kpi.budgetYTD)} kr.` },
                { label: 'Delta', value: `${kpi.deltaYTD >= 0 ? '+' : ''}${formatDKK(kpi.deltaYTD)} kr.` },
              ]}
            />
          </div>
        ) : null}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <MonthlyTurnoverChart data={chartData} hideBudget={isAllTime} />
          <CumulativeChart data={chartData} hideBudget={isAllTime} />
        </div>

        {businessAreas && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <BusinessAreaCard title="Consultancy" entries={businessAreas['Consultancy']} year={selectedYear} month={selectedMonth} budgetArea="consultancy" isAllTime={isAllTime} />
            <BusinessAreaCard title="Projects & Services" entries={businessAreas['Projects & Services']} year={selectedYear} month={selectedMonth} budgetArea="projectsAndServices" isAllTime={isAllTime} />
            <BusinessAreaCard title="Products" entries={businessAreas['Products']} year={selectedYear} month={selectedMonth} budgetArea="products" isAllTime={isAllTime} />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {!isAllTime && kpi && <BillingGauge actual={kpi.billingRatio} target={85} />}

          <div className="bg-white dark:bg-[#161618] rounded-xl border border-stone-200 dark:border-white/[0.10] p-4">
            <h4 className="text-sm font-medium text-stone-900 dark:text-stone-100 mb-3">Overview</h4>
            <div className="space-y-2">
              {[
                ...((!isAllTime && data) ? [
                  { label: `Days in ${getMonthLabelFull(selectedMonth)} ${selectedYear}`, value: `${new Date(selectedYear, selectedMonth, 0).getDate()} days, ${getWorkingDaysInMonth(selectedYear, selectedMonth)} workdays` },
                  { label: 'Working days YTD', value: String(getWorkingDaysYTD(selectedYear, selectedMonth)) },
                  { label: 'Target Load', value: '85%' },
                  { label: 'FTE', value: String(getFTECount(data.resources)) },
                ] : []),
                { label: 'Active Projects', value: String(ytdActiveProjects) },
              ].map((row, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 border-b border-stone-100 dark:border-white/[0.06] last:border-0">
                  <span className="text-sm text-stone-600 dark:text-stone-400">{row.label}</span>
                  <span className="text-sm font-semibold text-stone-900 dark:text-stone-100">{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {!isAllTime && kpi && <StatsTable kpi={kpi} />}
        </div>
      </div>
    </div>
  );
}
