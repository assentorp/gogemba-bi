import type { BudgetEntry, BudgetMeta, MonthlyBudget } from './types';

// Module-level store populated from the API
let budgetEntries: BudgetEntry[] = [];
let budgetMeta: BudgetMeta | null = null;

// Aggregated cache: "year-month" -> MonthlyBudget
const cache = new Map<string, MonthlyBudget>();

export function initBudgetData(entries: BudgetEntry[], meta?: BudgetMeta) {
  budgetEntries = entries;
  budgetMeta = meta || null;
  cache.clear();
}

export function getMonthlyBudget(year: number, month: number): MonthlyBudget {
  const key = `${year}-${month}`;
  if (cache.has(key)) return cache.get(key)!;

  const matching = budgetEntries.filter(e => e.year === year && e.month === month);
  const total = matching.reduce((sum, e) => sum + e.budgetDKK, 0);

  // Map SBU to business area: "Consulting" -> consultancy
  const consultancy = matching
    .filter(e => e.sbu === 'Consulting')
    .reduce((sum, e) => sum + e.budgetDKK, 0);

  const budget: MonthlyBudget = {
    month,
    year,
    total,
    consultancy,
    projectsAndServices: 0,
    products: 0,
  };

  cache.set(key, budget);
  return budget;
}

export function getBudgetForPeriod(
  startYear: number,
  startMonth: number,
  endYear: number,
  endMonth: number
): MonthlyBudget[] {
  const budgets: MonthlyBudget[] = [];
  let y = startYear;
  let m = startMonth;

  while (y < endYear || (y === endYear && m <= endMonth)) {
    budgets.push(getMonthlyBudget(y, m));
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }

  return budgets;
}

export function getYTDBudget(year: number, month: number): number {
  const budgets = getBudgetForPeriod(year, 1, year, month);
  return budgets.reduce((sum, b) => sum + b.total, 0);
}

export function getYTDBudgetByArea(year: number, month: number, area: 'consultancy' | 'projectsAndServices' | 'products'): number {
  const budgets = getBudgetForPeriod(year, 1, year, month);
  return budgets.reduce((sum, b) => sum + b[area], 0);
}

export function getBudgetMeta(): BudgetMeta | null {
  return budgetMeta;
}

/** Working days for a month from the budget file, or null if not available */
export function getBudgetWorkingDays(month: number): number | null {
  return budgetMeta?.workingDaysPerMonth[month] ?? null;
}

/** Hours per day from the budget file (e.g. 7.4 for Danish standard) */
export function getHoursPerDay(): number {
  return budgetMeta?.hoursPerDay ?? 7.4;
}

export function getBudgetEntries(): BudgetEntry[] {
  return budgetEntries;
}
