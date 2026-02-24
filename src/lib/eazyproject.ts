import { getISOWeek } from 'date-fns';
import type { TimesheetEntry } from './types';

// ── EazyProject REST API types (from /api/metadata) ───────────────

interface ReferenceDto {
  Id?: number;
  Title?: string;
}

interface TimeregistrationDto {
  Id?: number;
  Date?: string;
  Employee?: ReferenceDto;
  EmployeeCostprice?: number;
  EmployeeSaleprice?: number;
  Project?: ReferenceDto;
  Task?: ReferenceDto;
  Hours?: number;
  Comment?: string;
  Exported?: number;
  Createdate?: string;
  LeaderApprovedOn?: string;
}

interface ProjectDto {
  Id?: number;
  Projektname?: string;
  ProjectNumber?: string;
  Customer: ReferenceDto;
  Tasks?: ReferenceDto[];
}

interface EmployeeDto {
  Id?: number;
  Username?: string;
  Fullname?: string;
  Initials?: string;
  EmployeeNumber?: string;
  Email?: string;
}

// ServiceStack wraps responses in named properties
interface TimeregistrationsResponse {
  Timeregistrations?: TimeregistrationDto[];
}

interface ProjectsResponse {
  Projects?: ProjectDto[];
}

interface EmployeesResponse {
  Employees?: EmployeeDto[];
}

// ── Cache ──────────────────────────────────────────────────────────

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const cache = new Map<string, CacheEntry<unknown>>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

// ── API helpers ────────────────────────────────────────────────────

const API_URL = () => process.env.EAZYPROJECT_API_URL ?? '';
const API_TOKEN = () => process.env.EAZYPROJECT_API_TOKEN ?? '';

async function apiFetch<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`/api${path}`, API_URL());
  if (params) {
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${API_TOKEN()}`,
    },
    redirect: 'manual', // Don't follow 302 redirects to login page
  });

  // EazyProject redirects to login on auth failure
  if (res.status === 302) {
    throw new Error(`EazyProject ${path}: auth failed (302 redirect). Check API token.`);
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`EazyProject ${path} responded ${res.status}: ${body}`);
  }

  return res.json() as Promise<T>;
}

// ── Data fetchers (with caching) ──────────────────────────────────

async function fetchProjects(): Promise<Map<number, ProjectDto>> {
  const key = 'projects';
  const cached = getCached<Map<number, ProjectDto>>(key);
  if (cached) return cached;

  const resp = await apiFetch<ProjectsResponse>('/projects');
  const projects = resp.Projects ?? [];
  const map = new Map(projects.filter(p => p.Id != null).map(p => [p.Id!, p]));
  setCache(key, map);
  return map;
}

async function fetchEmployees(): Promise<Map<number, EmployeeDto>> {
  const key = 'employees';
  const cached = getCached<Map<number, EmployeeDto>>(key);
  if (cached) return cached;

  const resp = await apiFetch<EmployeesResponse>('/employees');
  const employees = resp.Employees ?? [];
  const map = new Map(employees.filter(e => e.Id != null).map(e => [e.Id!, e]));
  setCache(key, map);
  return map;
}

async function fetchTimeRegistrations(fromDate: string): Promise<TimeregistrationDto[]> {
  const key = `timereg-${fromDate}`;
  const cached = getCached<TimeregistrationDto[]>(key);
  if (cached) return cached;

  const resp = await apiFetch<TimeregistrationsResponse>('/timeregistrations', {
    FromDate: fromDate,
    ApprovalLevel: 'All',
  });
  const regs = resp.Timeregistrations ?? [];
  setCache(key, regs);
  return regs;
}

// ── Mapper ─────────────────────────────────────────────────────────

function toMonthYear(date: Date): string {
  return `${date.getMonth() + 1}-${date.getFullYear()}`;
}

export async function getEazyProjectEntries(fromDate = '2026-01-01'): Promise<TimesheetEntry[]> {
  const [regs, projectsMap, employeesMap] = await Promise.all([
    fetchTimeRegistrations(fromDate),
    fetchProjects(),
    fetchEmployees(),
  ]);

  return regs.map(reg => {
    const projectId = reg.Project?.Id;
    const project = projectId != null ? projectsMap.get(projectId) : undefined;
    const employeeId = reg.Employee?.Id;
    const employee = employeeId != null ? employeesMap.get(employeeId) : undefined;
    const date = new Date(reg.Date ?? '');
    const hours = reg.Hours ?? 0;
    const rate = reg.EmployeeSaleprice ?? 0;

    return {
      client: project?.Customer?.Title ?? 'Unknown',
      project: project?.Projektname ?? reg.Project?.Title ?? 'Unknown',
      subProject: reg.Task?.Title ?? '',
      budgetId: String(projectId ?? ''),
      activity: reg.Task?.Title ?? '',
      date: (reg.Date ?? '').slice(0, 10), // ISO YYYY-MM-DD
      week: getISOWeek(date),
      resource: employee?.Initials ?? `EMP-${employeeId}`,
      monthYear: toMonthYear(date),
      description: reg.Comment ?? '',
      hours,
      rate,
      totalDKK: hours * rate,
    };
  });
}
