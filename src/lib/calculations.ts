import type { TimesheetEntry, ResourceMeta, KPIData, BusinessArea } from './types';
import { getMonthlyBudget, getYTDBudget, getYTDBudgetByArea } from './budget-data';
import { getWorkingDaysInMonth, getWorkingDaysYTD } from './date-utils';

export function filterEntries(
  entries: TimesheetEntry[],
  filters: {
    dateFrom?: string;
    dateTo?: string;
    clients?: string[];
    projects?: string[];
    resources?: string[];
  }
): TimesheetEntry[] {
  return entries.filter(e => {
    if (filters.dateFrom && e.date < filters.dateFrom) return false;
    if (filters.dateTo && e.date > filters.dateTo) return false;
    if (filters.clients?.length && !filters.clients.includes(e.client)) return false;
    if (filters.projects?.length && !filters.projects.includes(e.project)) return false;
    if (filters.resources?.length && !filters.resources.includes(e.resource)) return false;
    return true;
  });
}

export function getEntriesForMonth(entries: TimesheetEntry[], year: number, month: number): TimesheetEntry[] {
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  return entries.filter(e => e.date.startsWith(prefix));
}

export function getEntriesYTD(entries: TimesheetEntry[], year: number, month: number): TimesheetEntry[] {
  const start = `${year}-01-01`;
  const endMonth = String(month).padStart(2, '0');
  const end = `${year}-${endMonth}-31`;
  return entries.filter(e => e.date >= start && e.date <= end);
}

export function sumHours(entries: TimesheetEntry[]): number {
  return entries.reduce((sum, e) => sum + e.hours, 0);
}

export function sumDKK(entries: TimesheetEntry[]): number {
  return entries.reduce((sum, e) => sum + e.totalDKK, 0);
}

export function avgRate(entries: TimesheetEntry[]): number {
  const hours = sumHours(entries);
  if (hours === 0) return 0;
  return sumDKK(entries) / hours;
}

export function activeProjectCount(entries: TimesheetEntry[]): number {
  return new Set(entries.map(e => e.budgetId)).size;
}

export function getFTECount(resources: ResourceMeta[]): number {
  return resources.filter(r => r.monthlyHours > 0).length;
}

// Classify entries by business area based on client/project patterns
export function getBusinessArea(entry: TimesheetEntry): BusinessArea {
  const client = entry.client.toLowerCase();
  const project = entry.project.toLowerCase();

  // Products: specific product projects
  if (project.includes('soop') || project.includes('product')) {
    return 'Products';
  }

  // Projects & Services: Lab-Vent, internal Kyodo projects, specific project types
  if (
    client === 'kyodo projects' ||
    client === 'lab-vent' ||
    client === 'zystm' ||
    project.includes('competition')
  ) {
    return 'Projects & Services';
  }

  // Default: Consultancy
  return 'Consultancy';
}

export function getEntriesByBusinessArea(entries: TimesheetEntry[]): Record<BusinessArea, TimesheetEntry[]> {
  const result: Record<BusinessArea, TimesheetEntry[]> = {
    'Consultancy': [],
    'Projects & Services': [],
    'Products': [],
  };

  for (const e of entries) {
    result[getBusinessArea(e)].push(e);
  }

  return result;
}

export function computeKPIs(
  allEntries: TimesheetEntry[],
  resources: ResourceMeta[],
  year: number,
  month: number
): KPIData {
  const mtdEntries = getEntriesForMonth(allEntries, year, month);
  const ytdEntries = getEntriesYTD(allEntries, year, month);

  const turnoverMTD = sumDKK(mtdEntries);
  const turnoverYTD = sumDKK(ytdEntries);

  const budget = getMonthlyBudget(year, month);
  const budgetMTD = budget.total;
  const budgetYTD = getYTDBudget(year, month);

  const fteCount = getFTECount(resources);
  const billedHoursYTD = sumHours(ytdEntries);

  const workingDaysMTD = getWorkingDaysInMonth(year, month);
  const workingDaysYTD = getWorkingDaysYTD(year, month);

  // Billing ratio: billed hours / (FTE * target monthly hours * months elapsed)
  const targetHoursPerMonth = resources.length > 0
    ? resources.reduce((sum, r) => sum + r.targetMonthlyHours, 0) / resources.length
    : 136.28;
  const totalCapacity = fteCount * targetHoursPerMonth * month;
  const billingRatio = totalCapacity > 0 ? (billedHoursYTD / totalCapacity) * 100 : 0;

  const hourlyRate = avgRate(ytdEntries);
  const turnoverPerDay = workingDaysYTD > 0 ? turnoverYTD / workingDaysYTD : 0;
  const turnoverPerFTE = fteCount > 0 ? turnoverYTD / fteCount : 0;
  const turnoverPerFTEPerDay = fteCount > 0 && workingDaysYTD > 0
    ? turnoverYTD / (fteCount * workingDaysYTD) : 0;

  return {
    turnoverMTD,
    turnoverYTD,
    budgetMTD,
    budgetYTD,
    deltaMTD: turnoverMTD - budgetMTD,
    deltaYTD: turnoverYTD - budgetYTD,
    indexMTD: budgetMTD > 0 ? (turnoverMTD / budgetMTD) * 100 : 0,
    indexYTD: budgetYTD > 0 ? (turnoverYTD / budgetYTD) * 100 : 0,
    billingRatio,
    avgHourlyRate: hourlyRate,
    turnoverPerDay,
    turnoverPerFTE,
    turnoverPerFTEPerDay,
    activeProjects: activeProjectCount(ytdEntries),
    billedHours: billedHoursYTD,
    totalHoursPercent: 100, // of filtered set
    workingDaysMTD,
    workingDaysYTD,
    fteCount,
  };
}

export function getMonthlyTurnoverData(
  entries: TimesheetEntry[],
  year: number,
  months?: number[]
): { month: number; label: string; turnover: number; budget: number; cumTurnover: number; cumBudget: number }[] {
  const monthRange = months || [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const labels = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  let cumTurnover = 0;
  let cumBudget = 0;

  return monthRange.map(m => {
    const monthEntries = getEntriesForMonth(entries, year, m);
    const turnover = sumDKK(monthEntries);
    const budget = getMonthlyBudget(year, m).total;
    cumTurnover += turnover;
    cumBudget += budget;

    return {
      month: m,
      label: labels[m],
      turnover,
      budget,
      cumTurnover,
      cumBudget,
    };
  });
}
