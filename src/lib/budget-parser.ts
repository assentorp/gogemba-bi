import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';
import type { BudgetEntry, BudgetMeta, BudgetResourceDef, BudgetSpecialDate } from './types';

const MONTH_MAP: Record<string, number> = {
  January: 1, February: 2, March: 3, April: 4,
  May: 5, June: 6, July: 7, August: 8,
  September: 9, October: 10, November: 11, December: 12,
};

let cachedEntries: BudgetEntry[] | null = null;
let cachedMeta: BudgetMeta | null = null;

function excelDateToISO(serial: number): string {
  const utcDays = Math.floor(serial - 25569);
  const date = new Date(utcDays * 86400 * 1000);
  return date.toISOString().split('T')[0];
}

function parseSheet(rows: unknown[][]) {
  const entries: BudgetEntry[] = [];
  const workingDaysPerMonth: Record<number, number> = {};
  const resources: BudgetResourceDef[] = [];
  const specialDates: BudgetSpecialDate[] = [];

  // Find Hours/day by scanning for the label (position can vary between file versions)
  let hoursPerDay = 7.4;
  for (let i = 0; i < Math.min(rows.length, 15); i++) {
    const row = rows[i] as (string | number | null)[];
    if (!row) continue;
    for (let j = 0; j < row.length; j++) {
      if (row[j] === 'Hours/day' && typeof row[j + 1] === 'number') {
        hoursPerDay = row[j + 1] as number;
        break;
      }
    }
  }

  let yearTotalBudget = 0;
  let yearTotalWorkingDays = 0;

  // Find where data rows start (first row with a numeric year in column 0)
  let dataStart = 3;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] as (string | number | null)[];
    if (row && typeof row[0] === 'number' && row[0] >= 2000) {
      dataStart = i;
      break;
    }
  }

  for (let i = dataStart; i < rows.length; i++) {
    const row = rows[i] as (string | number | null)[];
    if (!row) continue;

    // --- Budget breakdown (columns 0-6) ---
    const yearVal = row[0];
    if (typeof yearVal === 'number') {
      const monthStr = String(row[1] || '');
      const month = MONTH_MAP[monthStr];
      if (month) {
        entries.push({
          year: yearVal,
          month,
          sbu: String(row[2] || ''),
          resource: String(row[3] || ''),
          budgetHours: Math.round((Number(row[4]) || 0) * 100) / 100,
          avgRate: Math.round(Number(row[5]) || 0),
          budgetDKK: Math.round(Number(row[6]) || 0),
        });
      }
    }

    // --- Definitions section (columns 8-11): month names, working days, total budget ---
    const monthLong = row[8];
    if (typeof monthLong === 'string' && MONTH_MAP[monthLong]) {
      const month = MONTH_MAP[monthLong];
      const workingDays = Number(row[10]) || 0;
      workingDaysPerMonth[month] = workingDays;
    } else if (monthLong === 'Total') {
      yearTotalWorkingDays = Number(row[10]) || 0;
      yearTotalBudget = Number(row[11]) || 0;
    }

    // --- Resources section (columns 13-16): name, initials, rate, utilization ---
    const resName = row[13];
    if (typeof resName === 'string' && resName !== 'Total' && resName.length > 1) {
      const initials = String(row[14] || '');
      const avgRate = Number(row[15]) || 0;
      const utilTarget = Number(row[16]) || 0;
      if (initials && avgRate > 0) {
        resources.push({ name: resName, initials, avgRate, utilizationTarget: utilTarget });
      }
    }

    // --- Special dates section (columns 18-20): date, description, impact ---
    const dateVal = row[18];
    const dateDesc = row[19];
    if (dateVal && dateDesc) {
      let dateStr = '';
      if (typeof dateVal === 'number') {
        dateStr = excelDateToISO(dateVal);
      } else if (typeof dateVal === 'string') {
        dateStr = dateVal;
      }
      if (dateStr) {
        specialDates.push({
          date: dateStr,
          description: String(dateDesc),
          impact: String(row[20] || 'None'),
        });
      }
    }
  }

  const meta: BudgetMeta = {
    hoursPerDay,
    workingDaysPerMonth,
    resources,
    specialDates,
    yearTotalBudget,
    yearTotalWorkingDays,
  };

  return { entries, meta };
}

export function parseBudgetExcel(): { entries: BudgetEntry[]; meta: BudgetMeta } {
  if (cachedEntries && cachedMeta) {
    return { entries: cachedEntries, meta: cachedMeta };
  }

  const filePath = path.join(process.cwd(), 'data', 'budget.xlsx');
  if (!fs.existsSync(filePath)) {
    const emptyMeta: BudgetMeta = {
      hoursPerDay: 7.4,
      workingDaysPerMonth: {},
      resources: [],
      specialDates: [],
      yearTotalBudget: 0,
      yearTotalWorkingDays: 0,
    };
    return { entries: [], meta: emptyMeta };
  }

  const buffer = fs.readFileSync(filePath);
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });

  const result = parseSheet(rows);
  cachedEntries = result.entries;
  cachedMeta = result.meta;

  return result;
}
