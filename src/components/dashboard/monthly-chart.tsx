'use client';

import {
  Line,
  Area,
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
        <p key={i} className="text-stone-700 dark:text-stone-300">
          {entry.name}: {formatDKK(entry.value)} kr.
        </p>
      ))}
    </div>
  );
}

export function MonthlyTurnoverChart({ data, hideBudget }: MonthlyChartProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const gridColor = isDark ? '#262626' : '#f5f5f4';
  const textColor = isDark ? '#a8a29e' : '#6b7280';
  const primaryColor = isDark ? '#e5e5e5' : '#292524';
  const secondaryColor = isDark ? '#525252' : '#d6d3d1';

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
            <Bar dataKey="turnover" name="Turnover" fill={primaryColor} radius={[4, 4, 0, 0]} maxBarSize={40} />
            {!hideBudget && <Line dataKey="budget" name="Budget" stroke={secondaryColor} strokeWidth={2} strokeDasharray="6 3" dot={{ r: 3, fill: secondaryColor, strokeWidth: 0 }} type="monotone" />}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function CumulativeChart({ data, hideBudget }: MonthlyChartProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const gridColor = isDark ? '#262626' : '#f5f5f4';
  const textColor = isDark ? '#a8a29e' : '#6b7280';
  const primaryColor = isDark ? '#e5e5e5' : '#292524';
  const secondaryColor = isDark ? '#525252' : '#d6d3d1';

  return (
    <div className="bg-white dark:bg-[#161618] rounded-xl border border-stone-200 dark:border-white/[0.10] p-5">
      <h3 className="text-sm font-medium text-stone-900 dark:text-stone-100 mb-4">Cumulative Turnover vs Budget (YTD)</h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <defs>
              <linearGradient id="cumTurnoverFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={primaryColor} stopOpacity={0.15} />
                <stop offset="100%" stopColor={primaryColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: textColor }} />
            <YAxis tick={{ fontSize: 11, fill: textColor }} tickFormatter={v => `${(v / 1000).toFixed(0)}K`} width={50} />
            <Tooltip content={<CustomTooltip />} />
            <Legend iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} formatter={(value: string) => <span style={{ color: textColor }}>{value}</span>} />
            <Area dataKey="cumTurnover" name="Turnover (Acc.)" stroke={primaryColor} strokeWidth={2.5} fill="url(#cumTurnoverFill)" dot={{ r: 3, fill: primaryColor, strokeWidth: 0 }} type="monotone" />
            {!hideBudget && <Line dataKey="cumBudget" name="Budget (Acc.)" stroke={secondaryColor} strokeWidth={2} strokeDasharray="6 3" dot={{ r: 3, fill: secondaryColor, strokeWidth: 0 }} type="monotone" />}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
