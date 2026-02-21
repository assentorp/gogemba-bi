'use client';

import {
  ComposedChart,
  Line,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';
import { formatDKK, getMonthLabel } from '@/lib/date-utils';
import type { TimesheetEntry } from '@/lib/types';
import { getEntriesForMonth, sumDKK } from '@/lib/calculations';
import { getMonthlyBudget } from '@/lib/budget-data';
import { useTheme } from '@/context/ThemeContext';

interface BusinessAreaCardProps {
  title: string;
  entries: TimesheetEntry[];
  year: number;
  month: number;
  budgetArea: 'consultancy' | 'projectsAndServices' | 'products';
  isAllTime?: boolean;
}

export function BusinessAreaCard({ title, entries, year, month, budgetArea, isAllTime }: BusinessAreaCardProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const primaryColor = isDark ? '#e5e5e5' : '#292524';
  const secondaryColor = isDark ? '#525252' : '#d6d3d1';
  const textColor = isDark ? '#a8a29e' : '#6b7280';
  const gradientId = `sparkFill-${title.replace(/\s+/g, '')}`;

  const totalRevenue = sumDKK(entries);
  const totalHours = entries.reduce((s, e) => s + e.hours, 0);

  if (isAllTime) {
    const monthMap = new Map<string, number>();
    for (const e of entries) {
      const key = e.date.slice(0, 7);
      monthMap.set(key, (monthMap.get(key) || 0) + e.totalDKK);
    }
    const sparkData = [...monthMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, actual]) => {
        const [y, m] = key.split('-');
        return { month: key, label: `${getMonthLabel(parseInt(m))} ${y.slice(2)}`, actual, budget: 0 };
      });

    return (
      <div className="bg-white dark:bg-[#161618] rounded-xl border border-stone-200 dark:border-white/[0.10] p-4">
        <h4 className="text-sm font-medium text-stone-900 dark:text-stone-100 mb-3">{title}</h4>
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <p className="text-[11px] text-stone-500 dark:text-stone-400">Revenue</p>
            <p className="text-lg font-semibold text-stone-900 dark:text-stone-100">{formatDKK(totalRevenue)} kr.</p>
          </div>
          <div>
            <p className="text-[11px] text-stone-500 dark:text-stone-400">Hours</p>
            <p className="text-lg font-semibold text-stone-900 dark:text-stone-100">{totalHours.toLocaleString('da-DK', { maximumFractionDigits: 1 })}</p>
          </div>
        </div>
        <div className="h-28">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={sparkData} margin={{ bottom: 0, left: 0, right: 0, top: 0 }}>
              <defs>
                <linearGradient id={`${gradientId}-at`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={primaryColor} stopOpacity={0.2} />
                  <stop offset="100%" stopColor={primaryColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: textColor }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis hide />
              <Area dataKey="actual" stroke={primaryColor} strokeWidth={2} fill={`url(#${gradientId}-at)`} dot={false} type="monotone" />
            </ComposedChart>
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
      label: getMonthLabel(m),
      actual: sumDKK(mEntries),
      budget: mBudget,
    });
  }

  return (
    <div className="bg-white dark:bg-[#161618] rounded-xl border border-stone-200 dark:border-white/[0.10] p-4">
      <h4 className="text-sm font-medium text-stone-900 dark:text-stone-100 mb-3">{title}</h4>

      <div className="grid grid-cols-2 gap-4 mb-3">
        <div>
          <p className="text-[11px] text-stone-500 dark:text-stone-400">MTD</p>
          <p className="text-lg font-semibold text-stone-900 dark:text-stone-100">{formatDKK(turnoverMTD)} kr.</p>
          <p className="text-[11px] text-stone-500 dark:text-stone-400">Budget: {formatDKK(budgetMTD)}</p>
        </div>
        <div>
          <p className="text-[11px] text-stone-500 dark:text-stone-400">YTD</p>
          <p className="text-lg font-semibold text-stone-900 dark:text-stone-100">{formatDKK(turnoverYTD)} kr.</p>
          <p className="text-[11px] text-stone-500 dark:text-stone-400">Budget: {formatDKK(budgetYTD)}</p>
          {budgetYTD > 0 && (
            <span className={`inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded text-[11px] font-medium ${indexYTD >= 100 ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-red-500/10 text-red-500 dark:text-red-400'}`}>
              <svg width="7" height="5" viewBox="0 0 8 6" fill="currentColor">
                {indexYTD >= 100 ? <path d="M4 0L8 6H0L4 0Z" /> : <path d="M4 6L0 0H8L4 6Z" />}
              </svg>
              {indexYTD}%
            </span>
          )}
        </div>
      </div>

      <div className="h-28">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={sparkData} margin={{ bottom: 0, left: 0, right: 0, top: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={primaryColor} stopOpacity={0.2} />
                <stop offset="100%" stopColor={primaryColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: textColor }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Area dataKey="actual" stroke={primaryColor} strokeWidth={2} fill={`url(#${gradientId})`} dot={false} type="monotone" />
            <Line dataKey="budget" stroke={secondaryColor} strokeWidth={1.5} strokeDasharray="4 2" dot={false} type="monotone" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
