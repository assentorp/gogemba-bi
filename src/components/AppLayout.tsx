'use client';

import { useState, useEffect, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './sidebar';
import { Breadcrumb } from './Breadcrumb';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth < 1024) {
        setMobileMenuOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Skip sidebar/chrome on login page
  if (pathname === '/login') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a]">
      {/* Mobile header */}
      {isMobile && (
        <header className="fixed top-0 left-0 right-0 h-14 bg-white dark:bg-[#0a0a0a] border-b border-stone-200 dark:border-white/[0.06] z-50 flex items-center px-4">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 -ml-2 rounded-md text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
            aria-label="Toggle menu"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
          <div className="ml-3 flex items-center gap-2">
            <span className="text-xs font-semibold text-stone-800 dark:text-stone-200">
              kyodo <span className="text-stone-500 dark:text-stone-400">lab</span>
            </span>
          </div>
        </header>
      )}

      {/* Mobile backdrop */}
      {isMobile && mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <Sidebar
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        isMobile={isMobile}
        mobileMenuOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      {!isMobile && (
        <Breadcrumb
          sidebarCollapsed={sidebarCollapsed}
          isMobile={isMobile}
        />
      )}

      <main
        className={`transition-[margin] duration-200 ${
          isMobile
            ? 'ml-0 pt-14'
            : sidebarCollapsed
              ? 'ml-[52px] pt-14'
              : 'ml-[240px] pt-14'
        }`}
      >
        {children}
      </main>
    </div>
  );
}
