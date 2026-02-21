'use client';

import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Legend,
  Bar,
} from 'recharts';
import { formatDKK } from '@/lib/date-utils';
import { useTheme } from '@/context/ThemeContext';

interface MonthlyChartProps {
  data: {
    label: string;
    turnover: number;
    budget: number;
    cumTurnover: number;
    cumBudget: number;
  }[];
  hideBudget?: boolean;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-[#1e1e20] rounded-lg shadow-lg border border-stone-200 dark:border-white/[0.10] p-3 text-sm">
      <p className="font-medium text-stone-900 dark:text-stone-100 mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} style={{ color: entry.color }}>
          {entry.name}: {formatDKK(entry.value)} kr.
        </p>
      ))}
    </div>
  );
}

export function MonthlyTurnoverChart({ data, hideBudget }: MonthlyChartProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const gridColor = isDark ? '#333' : '#f0f0f0';
  const textColor = isDark ? '#a8a29e' : '#6b7280';

  return (
    <div className="bg-white dark:bg-[#161618] rounded-xl border border-stone-200 dark:border-white/[0.10] p-5">
      <h3 className="text-sm font-medium text-stone-900 dark:text-stone-100 mb-4">Monthly Turnover vs Budget</h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: textColor }} />
            <YAxis tick={{ fontSize: 11, fill: textColor }} tickFormatter={v => `${(v / 1000).toFixed(0)}K`} width={50} />
            <Tooltip content={<CustomTooltip />} />
            <Legend iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} formatter={(value: string) => <span style={{ color: textColor }}>{value}</span>} />
            <Bar dataKey="turnover" name="Turnover" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={40} />
            {!hideBudget && <Line dataKey="budget" name="Budget" stroke="#22c55e" strokeWidth={2} dot={{ r: 3, fill: '#22c55e' }} type="monotone" />}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function CumulativeChart({ data, hideBudget }: MonthlyChartProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const gridColor = isDark ? '#333' : '#f0f0f0';
  const textColor = isDark ? '#a8a29e' : '#6b7280';

  return (
    <div className="bg-white dark:bg-[#161618] rounded-xl border border-stone-200 dark:border-white/[0.10] p-5">
      <h3 className="text-sm font-medium text-stone-900 dark:text-stone-100 mb-4">Cumulative Turnover vs Budget (YTD)</h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: textColor }} />
            <YAxis tick={{ fontSize: 11, fill: textColor }} tickFormatter={v => `${(v / 1000).toFixed(0)}K`} width={50} />
            <Tooltip content={<CustomTooltip />} />
            <Legend iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} formatter={(value: string) => <span style={{ color: textColor }}>{value}</span>} />
            <Line dataKey="cumTurnover" name="Turnover (Acc.)" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 3, fill: '#6366f1' }} type="monotone" />
            {!hideBudget && <Line dataKey="cumBudget" name="Budget (Acc.)" stroke="#ef4444" strokeWidth={2} strokeDasharray="6 3" dot={{ r: 3, fill: '#ef4444' }} type="monotone" />}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
