import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { executeQuery } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const token = request.cookies.get('adminAuthToken')?.value || 
                  request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (decoded.type !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch placements from database
    const placements = await executeQuery<any>(`
      SELECT 
        p.id,
        CONCAT(c.first_name, ' ', c.last_name) as candidate_name,
        j.title as job_title,
        e.company_name as employer_name,
        p.placement_date,
        p.status,
        j.salary_range,
        p.created_at,
        p.updated_at
      FROM placements p
      LEFT JOIN candidates c ON p.candidate_id = c.id
      LEFT JOIN jobs j ON p.job_id = j.id
      LEFT JOIN employers e ON j.employer_id = e.id
      ORDER BY p.placement_date DESC, p.created_at DESC
      LIMIT 500
    `);

    return NextResponse.json({
      success: true,
      placements: placements || []
    });
  } catch (error: any) {
    console.error('Error fetching placements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch placements', details: error.message },
      { status: 500 }
    );
  }
}

