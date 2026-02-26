'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from './Icon';
import { KyodoLogo } from './KyodoLogo';

import layoutDashboard from 'lucide-static/icons/layout-dashboard.svg';
import folderKanban from 'lucide-static/icons/folder-kanban.svg';
import clock from 'lucide-static/icons/clock.svg';
import fileText from 'lucide-static/icons/file-text.svg';
import settingsIcon from 'lucide-static/icons/settings.svg';
import panelLeftClose from 'lucide-static/icons/panel-left-close.svg';
import panelLeft from 'lucide-static/icons/panel-left.svg';

const navItems = [
  { id: 'dashboard', href: '/', label: 'Dashboard', icon: layoutDashboard },
  { id: 'projects', href: '/projects', label: 'Project Economy', icon: folderKanban },
  { id: 'hours', href: '/hours', label: 'Hourly Report', icon: clock },
  { id: 'reports', href: '/reports', label: 'Report Generator', icon: fileText },
];

const bottomItems = [
  { id: 'settings', href: '/settings', label: 'Settings', icon: settingsIcon },
];

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobile?: boolean;
  mobileMenuOpen?: boolean;
  onMobileClose?: () => void;
}

function NavItem({ item, isActive, isCollapsed }: { item: typeof navItems[0]; isActive: boolean; isCollapsed?: boolean }) {
  if (isCollapsed) {
    return (
      <Link
        href={item.href}
        className={`
          flex items-center justify-center w-full p-2 rounded-md
          transition-colors duration-100
          ${isActive
            ? 'bg-stone-200 dark:bg-white/[0.08] text-stone-800 dark:text-stone-200'
            : 'text-stone-500 dark:text-stone-400 hover:bg-neutral-100 dark:hover:bg-white/[0.06] hover:text-stone-700 dark:hover:text-stone-200'
          }
        `}
        title={item.label}
      >
        <Icon src={item.icon} className="size-[18px]" />
      </Link>
    );
  }

  return (
    <Link
      href={item.href}
      className={`
        flex items-center gap-2.5 w-full py-1.5 pl-3 pr-3 rounded-md
        transition-colors duration-100
        ${isActive
          ? 'bg-neutral-100 dark:bg-white/[0.06] text-neutral-900 dark:text-neutral-100'
          : 'text-[#333336] dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/[0.06] hover:text-stone-800 dark:hover:text-stone-200'
        }
      `}
    >
      <Icon
        src={item.icon}
        className={`size-4 ${isActive ? 'text-stone-700 dark:text-stone-300' : 'text-stone-500 dark:text-stone-400'}`}
      />
      <span className="text-sm font-medium truncate">{item.label}</span>
    </Link>
  );
}

export function Sidebar({ isCollapsed, onToggleCollapse, isMobile, mobileMenuOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();

  // Mobile sidebar
  if (isMobile) {
    return (
      <aside className={`
        fixed left-0 top-0 bottom-0 z-50
        w-[280px] bg-white dark:bg-[#0a0a0a]
        border-r border-stone-200 dark:border-white/[0.06]
        flex flex-col
        transition-transform duration-200
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between px-4 h-14 border-b border-stone-200 dark:border-white/[0.06]">
          <KyodoLogo />
          <button
            onClick={onMobileClose}
            className="p-1.5 rounded-md text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-neutral-100 dark:hover:bg-white/[0.06] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
          {navItems.map((item) => (
            <div key={item.id} onClick={onMobileClose}>
              <NavItem item={item} isActive={pathname === item.href} />
            </div>
          ))}
        </nav>

        <div className="px-3 py-2 border-t border-stone-200 dark:border-white/[0.06]">
          {bottomItems.map((item) => (
            <div key={item.id} onClick={onMobileClose}>
              <NavItem item={item} isActive={pathname === item.href} />
            </div>
          ))}
        </div>
      </aside>
    );
  }

  // Collapsed sidebar
  if (isCollapsed) {
    return (
      <aside className="
        fixed left-0 top-0 bottom-0 z-40
        w-[52px] bg-white dark:bg-[#0a0a0a]
        border-r border-stone-200 dark:border-white/[0.06]
        flex flex-col
      ">
        <div className="flex items-center justify-center px-2 h-14 border-b border-stone-200 dark:border-white/[0.06]">
          <button
            onClick={onToggleCollapse}
            className="size-8 flex items-center justify-center rounded-md text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-neutral-100 dark:hover:bg-white/[0.06] transition-colors"
          >
            <Icon src={panelLeft} className="size-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-2 px-1.5 space-y-1">
          {navItems.map((item) => (
            <NavItem key={item.id} item={item} isActive={pathname === item.href} isCollapsed />
          ))}
        </nav>

        <div className="px-1.5 py-2 border-t border-stone-200 dark:border-white/[0.06]">
          {bottomItems.map((item) => (
            <NavItem key={item.id} item={item} isActive={pathname === item.href} isCollapsed />
          ))}
        </div>
      </aside>
    );
  }

  // Expanded sidebar
  return (
    <aside className="
      fixed left-0 top-0 bottom-0 z-40
      w-[240px] bg-white dark:bg-[#0a0a0a]
      border-r border-stone-200 dark:border-white/[0.06]
      flex flex-col
    ">
      <div className="flex items-center justify-between px-4 h-14 border-b border-stone-200 dark:border-white/[0.06]">
        <Link href="/" className="flex items-center">
          <KyodoLogo />
        </Link>
        <button
          onClick={onToggleCollapse}
          className="size-8 flex items-center justify-center rounded-md text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-neutral-100 dark:hover:bg-white/[0.06] transition-colors"
        >
          <Icon src={panelLeftClose} className="size-4" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
        {navItems.map((item) => (
          <NavItem key={item.id} item={item} isActive={pathname === item.href} />
        ))}
      </nav>

      <div className="px-3 py-2 border-t border-stone-200 dark:border-white/[0.06]">
        {bottomItems.map((item) => (
          <NavItem key={item.id} item={item} isActive={pathname === item.href} />
        ))}
      </div>
    </aside>
  );
}
