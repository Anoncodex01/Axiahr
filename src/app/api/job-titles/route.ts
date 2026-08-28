import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    // Resolve CSV from project root by default
    const csvPathCandidates = [
      path.join(process.cwd(), 'Job Title Master Sheet.csv'),
      path.join(process.cwd(), 'public', 'job-titles.csv'),
    ];

    let csvContent: string | null = null;

    for (const p of csvPathCandidates) {
      try {
        const buf = await fs.readFile(p);
        csvContent = buf.toString('utf-8');
        break;
      } catch (_) {
        // try next candidate
      }
    }

    if (!csvContent) {
      return NextResponse.json(
        { error: 'CSV not found. Ensure the file exists in project root or public/job-titles.csv' },
        { status: 404 }
      );
    }

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      },
    });
  } catch (err) {
    console.error('Error serving job titles CSV:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
