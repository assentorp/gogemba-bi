'use client';

import { Icon } from '@/components/Icon';
import trendingUp from 'lucide-static/icons/trending-up.svg';
import trendingDown from 'lucide-static/icons/trending-down.svg';

interface KPIBannerProps {
  title: string;
  value: string;
  items: { label: string; value: string }[];
  variant: 'gold' | 'dark';
}

export function KPIBanner({ title, value, items, variant }: KPIBannerProps) {
  const bg = variant === 'gold'
    ? 'bg-indigo-600'
    : 'bg-stone-900 dark:bg-[#161618]';

  return (
    <div className={`rounded-xl ${bg} text-white overflow-hidden ${variant === 'dark' ? 'border border-stone-800 dark:border-white/[0.10]' : ''}`}>
      <div className="px-5 pt-4 pb-2">
        <p className="text-xs font-medium text-white/90 uppercase tracking-wider">{title}</p>
        <p className="text-3xl font-semibold tracking-tight mt-1">{value}</p>
      </div>
      <div className="flex divide-x divide-white/30 bg-black/10 px-5 py-2.5">
        {items.map((item, i) => (
          <div key={i} className={`flex-1 ${i > 0 ? 'pl-4' : ''}`}>
            <p className="text-[10px] text-white/80 uppercase tracking-wider">{item.label}</p>
            <p className="text-sm font-semibold">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
