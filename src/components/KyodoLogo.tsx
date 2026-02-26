/* eslint-disable @next/next/no-img-element */
export function KyodoLogo({ className = 'h-4' }: { className?: string }) {
  return (
    <>
      <img src="/kyodo-logo-black.svg" alt="Kyodo Lab" className={`${className} dark:hidden`} />
      <img src="/kyodo-logo-white.svg" alt="Kyodo Lab" className={`${className} hidden dark:block`} />
    </>
  );
}
