import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';
import type { TimesheetEntry, ResourceMeta, ProjectMeta, ParsedData } from './types';

let cachedData: ParsedData | null = null;

function excelDateToISO(serial: number): string {
  const utcDays = Math.floor(serial - 25569);
  const date = new Date(utcDays * 86400 * 1000);
  return date.toISOString().split('T')[0];
}

function parseHoursSheet(ws: XLSX.WorkSheet): {
  entries: TimesheetEntry[];
  grandTotalHours: number;
  grandTotalDKK: number;
  avgRate: number;
} {
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');

  // Row 5 (0-indexed 4) has grand totals
  const grandTotalHours = Number(ws['O5']?.v) || 0;
  const grandTotalDKK = Number(ws['Q5']?.v) || 0;
  const avgRate = Number(ws['U5']?.v) || 0;

  const entries: TimesheetEntry[] = [];

  // Data rows start at row 7 (1-indexed), so 0-indexed row 6
  for (let r = 6; r <= range.e.r; r++) {
    const getCell = (col: string) => ws[`${col}${r + 1}`]?.v;

    const client = getCell('A');
    if (!client) continue; // skip empty rows

    const hours = Number(getCell('O')) || 0;
    const rate = Number(getCell('P')) || 0;
    const totalDKK = Number(getCell('Q')) || 0;

    let dateVal = getCell('F');
    let dateStr: string;
    if (typeof dateVal === 'number') {
      dateStr = excelDateToISO(dateVal);
    } else if (dateVal instanceof Date) {
      dateStr = dateVal.toISOString().split('T')[0];
    } else {
      dateStr = String(dateVal || '');
    }

    entries.push({
      client: String(client),
      project: String(getCell('B') || ''),
      subProject: String(getCell('C') || ''),
      budgetId: String(getCell('D') || ''),
      activity: String(getCell('E') || ''),
      date: dateStr,
      week: Number(getCell('G')) || 0,
      resource: String(getCell('H') || ''),
      monthYear: String(getCell('I') || ''),
      description: String(getCell('L') || ''),
      hours,
      rate,
      totalDKK,
    });
  }

  return { entries, grandTotalHours, grandTotalDKK, avgRate };
}

function parseMetaSheet(ws: XLSX.WorkSheet): {
  resources: ResourceMeta[];
  projects: ProjectMeta[];
  activities: string[];
} {
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  const resources: ResourceMeta[] = [];
  const projects: ProjectMeta[] = [];
  const activities: string[] = [];

  // Resources: columns N-R, starting at row 5 (1-indexed)
  for (let r = 4; r <= range.e.r; r++) {
    const initials = ws[`N${r + 1}`]?.v;
    if (!initials || initials === 'Fill in' || initials === 'Name [Initials]') continue;

    const monthlyHours = Number(ws[`O${r + 1}`]?.v) || 0;
    const dailyHours = Number(ws[`P${r + 1}`]?.v) || 0;
    const targetLoad = Number(ws[`Q${r + 1}`]?.v) || 0;

    if (monthlyHours > 0) {
      resources.push({
        initials: String(initials),
        monthlyHours,
        dailyHours,
        targetLoad,
        targetMonthlyHours: monthlyHours * targetLoad,
      });
    }
  }

  // Projects: columns A-L, starting at row 5 (1-indexed)
  for (let r = 4; r <= range.e.r; r++) {
    const client = ws[`A${r + 1}`]?.v;
    if (!client || client === 'Client [Name]') continue;

    projects.push({
      client: String(client),
      project: String(ws[`B${r + 1}`]?.v || ''),
      projectLookup: String(ws[`C${r + 1}`]?.v || ''),
      projectId: String(ws[`D${r + 1}`]?.v || ''),
      budgetId: String(ws[`E${r + 1}`]?.v || ''),
      budgetName: String(ws[`F${r + 1}`]?.v || ''),
      validFrom: String(ws[`G${r + 1}`]?.v || ''),
      resource: String(ws[`J${r + 1}`]?.v || ''),
      uid: String(ws[`K${r + 1}`]?.v || ''),
      rate: Number(ws[`L${r + 1}`]?.v) || 0,
      filteredOut: ws[`I${r + 1}`]?.v === 'Yes',
    });
  }

  // Activities: column T, starting at row 5
  for (let r = 4; r <= range.e.r; r++) {
    const activity = ws[`T${r + 1}`]?.v;
    if (activity && activity !== 'Consulting activities') {
      activities.push(String(activity));
    }
  }

  return { resources, projects, activities };
}

export function parseExcelData(): ParsedData {
  if (cachedData) return cachedData;

  const filePath = path.join(process.cwd(), 'data', 'timesheet.xlsx');
  const buffer = fs.readFileSync(filePath);
  const workbook = XLSX.read(buffer, { type: 'buffer' });

  const hoursSheet = workbook.Sheets[workbook.SheetNames[0]];
  const metaSheet = workbook.Sheets[workbook.SheetNames[1]];

  const { entries, grandTotalHours, grandTotalDKK, avgRate } = parseHoursSheet(hoursSheet);
  const { resources, projects, activities } = parseMetaSheet(metaSheet);

  cachedData = {
    entries,
    resources,
    projects,
    activities,
    grandTotalHours,
    grandTotalDKK,
    avgRate,
  };

  return cachedData;
}
