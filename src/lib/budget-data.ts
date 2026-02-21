import type { MonthlyBudget } from './types';

// Mock budget derived from actual data patterns:
// Average monthly actual: ~92K DKK, budget set ~8.5% higher = ~100K
// Business area split: Consultancy 55%, Projects & Services 35%, Products 10%
// Seasonal: Q1 lower (80-90K), Q2 medium (95-105K), Q3-Q4 higher (105-120K)

const seasonalFactors: Record<number, number> = {
  1: 0.82,  // January - low (post-holiday)
  2: 0.88,  // February
  3: 0.92,  // March
  4: 0.98,  // April
  5: 1.00,  // May
  6: 0.90,  // June (summer starts)
  7: 0.75,  // July (vacation)
  8: 0.95,  // August (ramp back)
  9: 1.10,  // September
  10: 1.15, // October (peak)
  11: 1.12, // November
  12: 0.85, // December (holidays)
};

const BASE_MONTHLY_BUDGET = 100_000; // DKK

export function getMonthlyBudget(year: number, month: number): MonthlyBudget {
  const factor = seasonalFactors[month] || 1.0;
  // Slight growth YoY
  const yearFactor = year === 2024 ? 0.95 : year === 2025 ? 1.0 : 1.05;
  const total = Math.round(BASE_MONTHLY_BUDGET * factor * yearFactor);

  return {
    month,
    year,
    total,
    consultancy: Math.round(total * 0.55),
    projectsAndServices: Math.round(total * 0.35),
    products: Math.round(total * 0.10),
  };
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
