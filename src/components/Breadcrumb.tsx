'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navigationMap: Record<string, { label: string; href?: string }> = {
  'projects': { label: 'Project Economy', href: '/projects' },
  'hours': { label: 'Hourly Report', href: '/hours' },
  'reports': { label: 'Report Generator', href: '/reports' },
  'settings': { label: 'Settings', href: '/settings' },
};

interface BreadcrumbProps {
  sidebarCollapsed: boolean;
  isMobile: boolean;
}

export function Breadcrumb({ sidebarCollapsed, isMobile }: BreadcrumbProps) {
  const pathname = usePathname();

  const segments = pathname.split('/').filter(Boolean);

  const breadcrumbs = segments.length === 0
    ? [{ label: 'Dashboard', href: undefined, isLast: true }]
    : segments.map((segment, index) => {
        const navItem = navigationMap[segment];
        const isLast = index === segments.length - 1;
        return {
          label: navItem?.label || segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' '),
          href: isLast ? undefined : navItem?.href,
          isLast,
        };
      });

  const leftOffset = isMobile ? 'left-0' : sidebarCollapsed ? 'left-[52px]' : 'left-[240px]';

  return (
    <header className={`bg-white dark:bg-[#0a0a0a] border-b border-stone-200 dark:border-white/[0.06] fixed top-0 right-0 z-10 h-14 transition-[left] duration-200 ${leftOffset}`}>
      <div className="flex items-center h-full px-6">
        <nav className="flex items-center gap-1.5">
          {breadcrumbs.map((crumb, index) => (
            <span key={index} className="flex items-center gap-1.5">
              {index > 0 && <span className="text-stone-300 dark:text-stone-600 text-base">&rsaquo;</span>}
              {crumb.href && !crumb.isLast ? (
                <Link
                  href={crumb.href}
                  className="text-base text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className={`text-base ${crumb.isLast ? 'font-medium text-stone-800 dark:text-stone-200' : 'text-stone-500 dark:text-stone-400'}`}>
                  {crumb.label}
                </span>
              )}
            </span>
          ))}
        </nav>
      </div>
    </header>
  );
}
