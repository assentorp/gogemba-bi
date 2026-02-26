import { NextResponse } from 'next/server';
import { getProjectBudgetSummaries } from '@/lib/eazyproject';

export async function GET() {
  try {
    const summaries = await getProjectBudgetSummaries();
    return NextResponse.json({ summaries });
  } catch (err) {
    console.error('[api/project-budgets] Failed:', err);
    return NextResponse.json(
      { error: 'Failed to load project budgets' },
      { status: 500 },
    );
  }
}
