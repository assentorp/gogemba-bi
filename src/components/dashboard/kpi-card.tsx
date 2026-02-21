'use client';

interface KPIBannerProps {
  title: string;
  value: string;
  badge?: { label: string; positive: boolean };
  items: { label: string; value: string }[];
}

function Triangle({ up }: { up: boolean }) {
  return (
    <svg width="8" height="6" viewBox="0 0 8 6" fill="currentColor">
      {up ? <path d="M4 0L8 6H0L4 0Z" /> : <path d="M4 6L0 0H8L4 6Z" />}
    </svg>
  );
}

export function KPIBanner({ title, value, badge, items }: KPIBannerProps) {
  return (
    <div className="bg-white dark:bg-[#161618] rounded-xl border border-stone-200 dark:border-white/[0.10] overflow-hidden">
      <div className="px-5 pt-4 pb-2">
        <p className="text-sm font-medium text-stone-900 dark:text-stone-100">{title}</p>
        <div className="flex items-center gap-3 mt-1">
          <p className="text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-100">{value}</p>
          {badge && (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[12px] font-medium ${badge.positive ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-red-500/10 text-red-500 dark:text-red-400'}`}>
              <Triangle up={badge.positive} />
              {badge.label}
            </span>
          )}
        </div>
      </div>
      <div className="flex divide-x divide-stone-200 dark:divide-white/[0.10] bg-stone-50 dark:bg-white/[0.03] px-5 py-2.5">
        {items.map((item, i) => (
          <div key={i} className={`flex-1 ${i > 0 ? 'pl-4' : ''}`}>
            <p className="text-[11px] text-stone-500 dark:text-stone-400">{item.label}</p>
            <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
