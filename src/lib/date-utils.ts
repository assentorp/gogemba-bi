import {
  startOfMonth,
  endOfMonth,
  startOfYear,
  eachDayOfInterval,
  isWeekend,
  format,
  parse,
  getYear,
  getMonth,
} from 'date-fns';

// Danish public holidays (fixed + computed)
function getDanishHolidays(year: number): Set<string> {
  const holidays = new Set<string>();

  // Fixed holidays
  holidays.add(`${year}-01-01`); // New Year
  holidays.add(`${year}-06-05`); // Constitution Day
  holidays.add(`${year}-12-24`); // Christmas Eve
  holidays.add(`${year}-12-25`); // Christmas Day
  holidays.add(`${year}-12-26`); // 2nd Christmas Day
  holidays.add(`${year}-12-31`); // New Year's Eve

  // Easter-based holidays (computus algorithm)
  const easter = getEasterDate(year);
  const addDays = (d: Date, n: number) => {
    const result = new Date(d);
    result.setDate(result.getDate() + n);
    return result;
  };

  const easterHolidays = [
    addDays(easter, -3), // Maundy Thursday
    addDays(easter, -2), // Good Friday
    easter,              // Easter Sunday
    addDays(easter, 1),  // Easter Monday
    addDays(easter, 26), // Great Prayer Day (Store Bededag) - removed 2024, but kept for historical
    addDays(easter, 39), // Ascension Day
    addDays(easter, 49), // Whit Sunday
    addDays(easter, 50), // Whit Monday
  ];

  for (const d of easterHolidays) {
    holidays.add(format(d, 'yyyy-MM-dd'));
  }

  return holidays;
}

function getEasterDate(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

export function getWorkingDays(from: Date, to: Date): number {
  if (from > to) return 0;
  const year = getYear(from);
  const holidays = getDanishHolidays(year);
  // Also get next year's holidays if range spans years
  const holidays2 = year !== getYear(to) ? getDanishHolidays(getYear(to)) : new Set<string>();
  const allHolidays = new Set([...holidays, ...holidays2]);

  const days = eachDayOfInterval({ start: from, end: to });
  return days.filter(d => !isWeekend(d) && !allHolidays.has(format(d, 'yyyy-MM-dd'))).length;
}

export function getWorkingDaysInMonth(year: number, month: number): number {
  const start = startOfMonth(new Date(year, month - 1));
  const end = endOfMonth(new Date(year, month - 1));
  return getWorkingDays(start, end);
}

export function getWorkingDaysYTD(year: number, month: number, day?: number): number {
  const start = startOfYear(new Date(year, 0));
  const end = day
    ? new Date(year, month - 1, day)
    : endOfMonth(new Date(year, month - 1));
  return getWorkingDays(start, end);
}

export function formatDKK(amount: number): string {
  return new Intl.NumberFormat('da-DK', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
}

export function formatDKKShort(amount: number): string {
  if (Math.abs(amount) >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(amount) >= 1_000) {
    return `${(amount / 1_000).toFixed(0)}K`;
  }
  return formatDKK(amount);
}

export function formatHours(hours: number): string {
  return new Intl.NumberFormat('da-DK', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(hours);
}

export function parseMonthYear(monthYear: string): { month: number; year: number } {
  const [m, y] = monthYear.split('-').map(Number);
  return { month: m, year: y };
}

export function getMonthLabel(month: number): string {
  const labels = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return labels[month] || '';
}

export function getMonthLabelFull(month: number): string {
  const labels = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return labels[month] || '';
}

export function toMonthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

export function parseMonthKey(key: string): { year: number; month: number } {
  const [y, m] = key.split('-').map(Number);
  return { year: y, month: m };
}
