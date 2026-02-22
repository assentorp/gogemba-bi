import * as XLSX from 'xlsx';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function excelDateToISO(serial) {
  const utcDays = Math.floor(serial - 25569);
  const date = new Date(utcDays * 86400 * 1000);
  return date.toISOString().split('T')[0];
}

const filePath = join(root, 'data', 'timesheet.xlsx');
const buffer = readFileSync(filePath);
const workbook = XLSX.read(buffer, { type: 'buffer' });

const hoursSheet = workbook.Sheets[workbook.SheetNames[0]];
const metaSheet = workbook.Sheets[workbook.SheetNames[1]];

// Parse hours sheet
const hRange = XLSX.utils.decode_range(hoursSheet['!ref'] || 'A1');
const grandTotalHours = Number(hoursSheet['O5']?.v) || 0;
const grandTotalDKK = Number(hoursSheet['Q5']?.v) || 0;
const avgRate = Number(hoursSheet['U5']?.v) || 0;

const entries = [];
for (let r = 6; r <= hRange.e.r; r++) {
  const getCell = (col) => hoursSheet[`${col}${r + 1}`]?.v;
  const client = getCell('A');
  if (!client) continue;

  let dateVal = getCell('F');
  let dateStr;
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
    hours: Number(getCell('O')) || 0,
    rate: Number(getCell('P')) || 0,
    totalDKK: Number(getCell('Q')) || 0,
  });
}

// Parse meta sheet
const mRange = XLSX.utils.decode_range(metaSheet['!ref'] || 'A1');
const resources = [];
const projects = [];
const activities = [];

for (let r = 4; r <= mRange.e.r; r++) {
  const initials = metaSheet[`N${r + 1}`]?.v;
  if (initials && initials !== 'Fill in' && initials !== 'Name [Initials]') {
    const monthlyHours = Number(metaSheet[`O${r + 1}`]?.v) || 0;
    const dailyHours = Number(metaSheet[`P${r + 1}`]?.v) || 0;
    const targetLoad = Number(metaSheet[`Q${r + 1}`]?.v) || 0;
    if (monthlyHours > 0) {
      resources.push({ initials: String(initials), monthlyHours, dailyHours, targetLoad, targetMonthlyHours: monthlyHours * targetLoad });
    }
  }

  const client = metaSheet[`A${r + 1}`]?.v;
  if (client && client !== 'Client [Name]') {
    projects.push({
      client: String(client),
      project: String(metaSheet[`B${r + 1}`]?.v || ''),
      projectLookup: String(metaSheet[`C${r + 1}`]?.v || ''),
      projectId: String(metaSheet[`D${r + 1}`]?.v || ''),
      budgetId: String(metaSheet[`E${r + 1}`]?.v || ''),
      budgetName: String(metaSheet[`F${r + 1}`]?.v || ''),
      validFrom: String(metaSheet[`G${r + 1}`]?.v || ''),
      resource: String(metaSheet[`J${r + 1}`]?.v || ''),
      uid: String(metaSheet[`K${r + 1}`]?.v || ''),
      rate: Number(metaSheet[`L${r + 1}`]?.v) || 0,
      filteredOut: metaSheet[`I${r + 1}`]?.v === 'Yes',
    });
  }

  const activity = metaSheet[`T${r + 1}`]?.v;
  if (activity && activity !== 'Consulting activities') {
    activities.push(String(activity));
  }
}

const data = { entries, resources, projects, activities, grandTotalHours, grandTotalDKK, avgRate };

mkdirSync(join(root, 'public', 'data'), { recursive: true });
writeFileSync(join(root, 'public', 'data', 'timesheet.json'), JSON.stringify(data));

console.log(`Generated timesheet.json: ${entries.length} entries, ${resources.length} resources, ${projects.length} projects`);
