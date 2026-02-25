export interface TimesheetEntry {
  client: string;
  project: string;
  subProject: string;
  budgetId: string;
  activity: string;
  date: string; // ISO date string
  week: number;
  resource: string;
  monthYear: string; // "3-2024" format
  description: string;
  hours: number;
  rate: number;
  totalDKK: number;
}

export interface ResourceMeta {
  initials: string;
  monthlyHours: number;
  dailyHours: number;
  targetLoad: number; // 0.85
  targetMonthlyHours: number; // monthlyHours * targetLoad
}

export interface ProjectMeta {
  client: string;
  project: string;
  projectLookup: string;
  projectId: string;
  budgetId: string;
  budgetName: string;
  validFrom: string;
  resource: string;
  uid: string;
  rate: number;
  filteredOut: boolean;
}

export interface ParsedData {
  entries: TimesheetEntry[];
  resources: ResourceMeta[];
  projects: ProjectMeta[];
  activities: string[];
  grandTotalHours: number;
  grandTotalDKK: number;
  avgRate: number;
  budgetEntries?: BudgetEntry[];
  budgetMeta?: BudgetMeta;
}

export interface BudgetEntry {
  year: number;
  month: number; // 1-12
  sbu: string;
  resource: string;
  budgetHours: number;
  avgRate: number;
  budgetDKK: number;
}

export interface BudgetResourceDef {
  name: string;
  initials: string;
  avgRate: number;
  utilizationTarget: number; // e.g. 0.85
}

export interface BudgetSpecialDate {
  date: string; // ISO date
  description: string;
  impact: string; // "None", "Half day off", "Office closed"
}

export interface BudgetMeta {
  hoursPerDay: number;
  workingDaysPerMonth: Record<number, number>; // month (1-12) -> working days
  resources: BudgetResourceDef[];
  specialDates: BudgetSpecialDate[];
  yearTotalBudget: number;
  yearTotalWorkingDays: number;
}

export interface MonthlyBudget {
  month: number; // 1-12
  year: number;
  total: number;
  consultancy: number;
  projectsAndServices: number;
  products: number;
}

export interface FilterState {
  dateFrom: string;
  dateTo: string;
  selectedMonth: string; // "YYYY-MM"
  isAllTime: boolean;
  clients: string[];
  projects: string[];
  resources: string[];
}

export type BusinessArea = 'Consultancy' | 'Projects & Services' | 'Products';

export interface KPIData {
  turnoverMTD: number;
  turnoverYTD: number;
  budgetMTD: number;
  budgetYTD: number;
  deltaMTD: number;
  deltaYTD: number;
  indexMTD: number;
  indexYTD: number;
  billingRatio: number;
  avgHourlyRate: number;
  turnoverPerDay: number;
  turnoverPerFTE: number;
  turnoverPerFTEPerDay: number;
  activeProjects: number;
  billedHours: number;
  totalHoursPercent: number;
  workingDaysMTD: number;
  workingDaysYTD: number;
  fteCount: number;
}
