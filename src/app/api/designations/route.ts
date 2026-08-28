import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    const candidates = [
      path.join(process.cwd(), 'All_Designations.csv'),
      path.join(process.cwd(), 'public', 'All_Designations.csv'),
    ];

    let csvContent: string | null = null;

    for (const p of candidates) {
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
        { error: 'Designations CSV not found. Ensure All_Designations.csv exists in project root or public/All_Designations.csv' },
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
    console.error('Error serving designations CSV:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
