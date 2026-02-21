'use client';

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useTheme } from '@/context/ThemeContext';

interface BillingGaugeProps {
  actual: number;
  target: number;
}

export function BillingGauge({ actual, target }: BillingGaugeProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const capped = Math.min(actual, 100);
  const data = [
    { value: capped },
    { value: 100 - capped },
  ];

  const fillColor = isDark ? '#e5e5e5' : '#292524';
  const trackColor = isDark ? '#2a2a2c' : '#f3f4f6';

  return (
    <div className="bg-white dark:bg-[#161618] rounded-xl border border-stone-200 dark:border-white/[0.10] p-4">
      <h4 className="text-sm font-medium text-stone-900 dark:text-stone-100 mb-2">
        Billing Ratio
      </h4>
      <div className="relative h-36 flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="65%"
              startAngle={180}
              endAngle={0}
              innerRadius="65%"
              outerRadius="90%"
              dataKey="value"
              stroke="none"
            >
              <Cell fill={fillColor} />
              <Cell fill={trackColor} />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-4">
          <p className="text-2xl font-semibold text-stone-900 dark:text-stone-100">{Math.round(actual)}%</p>
          <p className="text-[11px] text-stone-500 dark:text-stone-400">Target: {target}%</p>
        </div>
      </div>
      <div className="flex items-center justify-center gap-4 text-xs text-stone-500 dark:text-stone-400 mt-1">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: fillColor }} />
          Actual
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: trackColor }} />
          Target {target}%
        </div>
      </div>
    </div>
  );
}
