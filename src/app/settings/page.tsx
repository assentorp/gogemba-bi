'use client';

import { useTheme } from '@/context/ThemeContext';
import { Icon } from '@/components/Icon';
import sun from 'lucide-static/icons/sun.svg';
import moon from 'lucide-static/icons/moon.svg';
import monitor from 'lucide-static/icons/monitor.svg';

type Theme = 'light' | 'dark' | 'system';

const themeOptions: { value: Theme; label: string; description: string; icon: string }[] = [
  { value: 'light', label: 'Light', description: 'Light background with dark text', icon: sun },
  { value: 'dark', label: 'Dark', description: 'Dark background with light text', icon: moon },
  { value: 'system', label: 'System', description: 'Follows your OS preference', icon: monitor },
];

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="bg-[#FCFCFC] dark:bg-[#0a0a0a]">
      <div className="max-w-2xl mx-auto py-12 px-6">
        <header className="mb-10">
          <h1 className="text-3xl font-semibold text-neutral-900 dark:text-neutral-100 tracking-[-0.02em] mb-2">
            Preferences
          </h1>
          <p className="text-base text-neutral-600 dark:text-neutral-400">
            Manage your workspace settings
          </p>
        </header>

        <section>
          <h2 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-4">
            Interface and theme
          </h2>
          <div className="bg-white dark:bg-[#161618] rounded-2xl border border-neutral-200/60 dark:border-white/[0.10] shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.06)]">
            <div className="px-5 py-4">
              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-1">Interface theme</p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
                Select your preferred theme
              </p>

              <div className="grid grid-cols-3 gap-3">
                {themeOptions.map((option) => {
                  const isSelected = theme === option.value;
                  return (
                    <button
                      key={option.value}
                      onClick={() => setTheme(option.value)}
                      className={`
                        flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-150
                        ${isSelected
                          ? 'border-indigo-500 bg-indigo-500/5 dark:bg-indigo-500/10 ring-1 ring-indigo-500/20'
                          : 'border-neutral-200 dark:border-white/[0.10] hover:border-neutral-300 dark:hover:border-white/[0.15] hover:bg-neutral-50 dark:hover:bg-white/[0.03]'
                        }
                      `}
                    >
                      <Icon
                        src={option.icon}
                        className={`size-5 ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-neutral-500 dark:text-neutral-400'}`}
                      />
                      <span className={`text-sm font-medium ${isSelected ? 'text-stone-900 dark:text-stone-100' : 'text-neutral-700 dark:text-neutral-300'}`}>
                        {option.label}
                      </span>
                      <span className="text-[11px] text-neutral-500 dark:text-neutral-400 text-center leading-tight">
                        {option.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
