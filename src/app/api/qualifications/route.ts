import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { verifyAdminAuth } from '@/lib/adminAuth';

async function resolveQualificationsCsv() {
  const candidates = [
    path.join(process.cwd(), 'qualifications_and_specializations.csv'),
    path.join(process.cwd(), 'public', 'qualifications_and_specializations.csv'),
  ];

  for (const p of candidates) {
    try {
      await fs.access(p);
      return p;
    } catch (_) {}
  }

  return candidates[1];
}

function escapeCsv(value: string) {
  const normalized = value.replace(/\r?\n/g, ' ').trim();
  return /[",]/.test(normalized) ? `"${normalized.replace(/"/g, '""')}"` : normalized;
}

export async function GET() {
  try {
    let csvContent: string | null = null;
    const csvPath = await resolveQualificationsCsv();

    try {
      const buf = await fs.readFile(csvPath);
      csvContent = buf.toString('utf-8');
    } catch (_) {}

    if (!csvContent) {
      return NextResponse.json(
        { error: 'Qualifications CSV not found. Place qualifications_and_specializations.csv in project root or public/qualifications_and_specializations.csv' },
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
    console.error('Error serving qualifications CSV:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdminAuth(request);
    if (!auth.authenticated) {
      return NextResponse.json(
        { success: false, error: auth.error || 'Admin authentication required.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const category = String(body.category || '').trim();
    const qualification = String(body.qualification || '').trim();
    const specializations = Array.isArray(body.specializations)
      ? body.specializations.map((item: unknown) => String(item).trim()).filter(Boolean)
      : String(body.specializations || '').split(',').map((item) => item.trim()).filter(Boolean);

    if (!category || !qualification) {
      return NextResponse.json(
        { success: false, error: 'Category and qualification are required.' },
        { status: 400 }
      );
    }

    const csvPath = await resolveQualificationsCsv();
    await fs.mkdir(path.dirname(csvPath), { recursive: true });

    let existing = '';
    try {
      existing = await fs.readFile(csvPath, 'utf-8');
    } catch (_) {
      existing = 'Category,Qualification,Specializations\n';
    }

    const lowerExisting = existing.toLowerCase();
    const key = `${category},${qualification}`.toLowerCase();
    if (lowerExisting.includes(key)) {
      return NextResponse.json(
        { success: false, error: 'This qualification already exists.' },
        { status: 409 }
      );
    }

    const row = [
      escapeCsv(category),
      escapeCsv(qualification),
      escapeCsv(specializations.join('; '))
    ].join(',');

    const prefix = existing.endsWith('\n') || existing.length === 0 ? '' : '\n';
    await fs.appendFile(csvPath, `${prefix}${row}\n`, 'utf-8');

    return NextResponse.json({
      success: true,
      message: 'Qualification added successfully.',
      data: { category, qualification, specializations }
    });
  } catch (err) {
    console.error('Error adding qualification:', err);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
