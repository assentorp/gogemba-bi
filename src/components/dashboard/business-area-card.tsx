'use client';

import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';
import { formatDKK } from '@/lib/date-utils';
import type { TimesheetEntry } from '@/lib/types';
import { getEntriesForMonth, sumDKK } from '@/lib/calculations';
import { getMonthlyBudget } from '@/lib/budget-data';

interface BusinessAreaCardProps {
  title: string;
  entries: TimesheetEntry[];
  year: number;
  month: number;
  budgetArea: 'consultancy' | 'projectsAndServices' | 'products';
  isAllTime?: boolean;
}

export function BusinessAreaCard({ title, entries, year, month, budgetArea, isAllTime }: BusinessAreaCardProps) {
  const totalRevenue = sumDKK(entries);
  const totalHours = entries.reduce((s, e) => s + e.hours, 0);

  if (isAllTime) {
    // All-time: group by year-month for sparkline
    const monthMap = new Map<string, number>();
    for (const e of entries) {
      const key = e.date.slice(0, 7);
      monthMap.set(key, (monthMap.get(key) || 0) + e.totalDKK);
    }
    const sparkData = [...monthMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, actual]) => ({ month: key, actual, budget: 0 }));

    return (
      <div className="bg-white dark:bg-[#161618] rounded-xl border border-stone-200 dark:border-white/[0.10] p-4">
        <h4 className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-3">{title}</h4>
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <p className="text-[10px] text-stone-500 dark:text-stone-400 uppercase">Revenue</p>
            <p className="text-lg font-semibold text-stone-900 dark:text-stone-100">{formatDKK(totalRevenue)} kr.</p>
          </div>
          <div>
            <p className="text-[10px] text-stone-500 dark:text-stone-400 uppercase">Hours</p>
            <p className="text-lg font-semibold text-stone-900 dark:text-stone-100">{totalHours.toLocaleString('da-DK', { maximumFractionDigits: 1 })}</p>
          </div>
        </div>
        <div className="h-20">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparkData}>
              <XAxis dataKey="month" hide />
              <YAxis hide />
              <Line dataKey="actual" stroke="#6366f1" strokeWidth={2} dot={false} type="monotone" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  const mtdEntries = getEntriesForMonth(entries, year, month);
  const turnoverMTD = sumDKK(mtdEntries);

  const ytdEntries = entries.filter(e => {
    const eYear = parseInt(e.date.split('-')[0]);
    const eMonth = parseInt(e.date.split('-')[1]);
    return eYear === year && eMonth <= month;
  });
  const turnoverYTD = sumDKK(ytdEntries);

  const budgetMTD = getMonthlyBudget(year, month)[budgetArea];
  let budgetYTD = 0;
  for (let m = 1; m <= month; m++) {
    budgetYTD += getMonthlyBudget(year, m)[budgetArea];
  }

  const indexYTD = budgetYTD > 0 ? Math.round((turnoverYTD / budgetYTD) * 100) : 0;

  const sparkData = [];
  for (let m = 1; m <= month; m++) {
    const mEntries = getEntriesForMonth(entries, year, m);
    const mBudget = getMonthlyBudget(year, m)[budgetArea];
    sparkData.push({
      month: m,
      actual: sumDKK(mEntries),
      budget: mBudget,
    });
  }

  return (
    <div className="bg-white dark:bg-[#161618] rounded-xl border border-stone-200 dark:border-white/[0.10] p-4">
      <h4 className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-3">{title}</h4>

      <div className="grid grid-cols-2 gap-4 mb-3">
        <div>
          <p className="text-[10px] text-stone-500 dark:text-stone-400 uppercase">MTD</p>
          <p className="text-lg font-semibold text-stone-900 dark:text-stone-100">{formatDKK(turnoverMTD)} kr.</p>
          <p className="text-[10px] text-stone-500 dark:text-stone-400">Budget: {formatDKK(budgetMTD)}</p>
        </div>
        <div>
          <p className="text-[10px] text-stone-500 dark:text-stone-400 uppercase">YTD</p>
          <p className="text-lg font-semibold text-stone-900 dark:text-stone-100">{formatDKK(turnoverYTD)} kr.</p>
          <p className="text-[10px] text-stone-500 dark:text-stone-400">Budget: {formatDKK(budgetYTD)}</p>
          {budgetYTD > 0 && (
            <p className={`text-[10px] font-medium ${indexYTD >= 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              Index: {indexYTD}%
            </p>
          )}
        </div>
      </div>

      <div className="h-20">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={sparkData}>
            <XAxis dataKey="month" hide />
            <YAxis hide />
            <Line dataKey="actual" stroke="#6366f1" strokeWidth={2} dot={false} type="monotone" />
            <Line dataKey="budget" stroke="#ef4444" strokeWidth={1.5} strokeDasharray="4 2" dot={false} type="monotone" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
