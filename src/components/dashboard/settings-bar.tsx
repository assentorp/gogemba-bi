'use client';

import { useFilters } from '@/lib/filter-context';
import { getWorkingDaysInMonth, getWorkingDaysYTD, getMonthLabelFull } from '@/lib/date-utils';
import type { ResourceMeta } from '@/lib/types';
import { getFTECount } from '@/lib/calculations';

interface SettingsBarProps {
  resources: ResourceMeta[];
}

export function SettingsBar({ resources }: SettingsBarProps) {
  const { selectedYear, selectedMonth } = useFilters();
  const fteCount = getFTECount(resources);
  const workingDaysMTD = getWorkingDaysInMonth(selectedYear, selectedMonth);
  const workingDaysYTD = getWorkingDaysYTD(selectedYear, selectedMonth);
  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();

  return (
    <div className="bg-white dark:bg-[#161618] rounded-xl border border-stone-200 dark:border-white/[0.10] p-4">
      <div className="flex flex-wrap items-center gap-6 text-sm">
        <div>
          <span className="text-[10px] font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider block">Period</span>
          <span className="font-medium text-stone-900 dark:text-stone-100">{getMonthLabelFull(selectedMonth)} {selectedYear}</span>
        </div>
        <div className="h-8 w-px bg-stone-200 dark:bg-white/[0.08]" />
        <div>
          <span className="text-[10px] font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider block">Days in month</span>
          <span className="font-medium text-stone-900 dark:text-stone-100">{daysInMonth} days, {workingDaysMTD} workdays</span>
        </div>
        <div className="h-8 w-px bg-stone-200 dark:bg-white/[0.08]" />
        <div>
          <span className="text-[10px] font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider block">Target Load</span>
          <span className="font-medium text-stone-900 dark:text-stone-100">85%</span>
        </div>
        <div className="h-8 w-px bg-stone-200 dark:bg-white/[0.08]" />
        <div>
          <span className="text-[10px] font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider block">FTE</span>
          <span className="font-medium text-stone-900 dark:text-stone-100">{fteCount}</span>
        </div>
        <div className="h-8 w-px bg-stone-200 dark:bg-white/[0.08]" />
        <div>
          <span className="text-[10px] font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider block">Working days YTD</span>
          <span className="font-medium text-stone-900 dark:text-stone-100">{workingDaysYTD}</span>
        </div>
      </div>
    </div>
  );
}
