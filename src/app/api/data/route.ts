import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import type { ParsedData, TimesheetEntry } from '@/lib/types';
import { getEazyProjectEntries } from '@/lib/eazyproject';

const CUTOFF_DATE = '2026-01-01';

export async function GET() {
  try {
    // 1. Load static JSON (Excel-sourced historical data)
    const jsonPath = path.join(process.cwd(), 'public', 'data', 'timesheet.json');
    const raw = await fs.readFile(jsonPath, 'utf-8');
    const staticData: ParsedData = JSON.parse(raw);

    // 2. Filter Excel entries to pre-2026 only
    const historicalEntries = staticData.entries.filter(e => e.date < CUTOFF_DATE);

    // 3. Fetch 2026+ entries from EazyProject
    let apiEntries: TimesheetEntry[] = [];
    try {
      apiEntries = await getEazyProjectEntries(CUTOFF_DATE);
    } catch (err) {
      console.error('[api/data] EazyProject fetch failed, returning historical only:', err);
    }

    // 4. Merge
    const allEntries = [...historicalEntries, ...apiEntries];

    // 5. Recompute grand totals
    const grandTotalHours = allEntries.reduce((s, e) => s + e.hours, 0);
    const grandTotalDKK = allEntries.reduce((s, e) => s + e.totalDKK, 0);
    const avgRate = grandTotalHours > 0 ? grandTotalDKK / grandTotalHours : 0;

    // 6. Keep metadata from static file (resources, projects, activities have FTE config etc.)
    const merged: ParsedData = {
      entries: allEntries,
      resources: staticData.resources,
      projects: staticData.projects,
      activities: staticData.activities,
      grandTotalHours,
      grandTotalDKK,
      avgRate,
    };

    return NextResponse.json(merged);
  } catch (err) {
    console.error('[api/data] Failed:', err);
    return NextResponse.json(
      { error: 'Failed to load data' },
      { status: 500 },
    );
  }
}
