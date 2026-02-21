'use client';

import { formatDKK, formatHours } from '@/lib/date-utils';
import type { KPIData } from '@/lib/types';

interface StatsTableProps {
  kpi: KPIData;
}

export function StatsTable({ kpi }: StatsTableProps) {
  const rows = [
    { label: 'Billed hours', value: `${formatHours(kpi.billedHours)} hrs` },
    { label: 'Average hourly rate', value: `${formatDKK(Math.round(kpi.avgHourlyRate))} kr.` },
    { label: 'Turnover / day', value: `${formatDKK(Math.round(kpi.turnoverPerDay))} kr.` },
    { label: 'Turnover / FTE', value: `${formatDKK(Math.round(kpi.turnoverPerFTE))} kr.` },
    { label: 'Turnover / FTE / day', value: `${formatDKK(Math.round(kpi.turnoverPerFTEPerDay))} kr.` },
  ];

  return (
    <div className="bg-white dark:bg-[#161618] rounded-xl border border-stone-200 dark:border-white/[0.10] p-4">
      <h4 className="text-sm font-medium text-stone-900 dark:text-stone-100 mb-3">Key Statistics (YTD)</h4>
      <div className="space-y-2">
        {rows.map((row, i) => (
          <div key={i} className="flex items-center justify-between py-1.5 border-b border-stone-100 dark:border-white/[0.06] last:border-0">
            <span className="text-sm text-stone-600 dark:text-stone-400">{row.label}</span>
            <span className="text-sm font-semibold text-stone-900 dark:text-stone-100">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
