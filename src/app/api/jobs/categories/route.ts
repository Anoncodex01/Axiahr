import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';

// GET - Get job titles from actual jobs in database
export async function GET(request: NextRequest) {
  try {
    // Get unique job titles from published jobs
    const jobTitles = await executeQuery<any>(
      `SELECT 
        j.title,
        COUNT(j.id) as count
      FROM jobs j
      LEFT JOIN employers e ON j.employer_id = e.id
      WHERE j.status = 'published'
        AND (j.deadline IS NULL OR j.deadline >= CURDATE())
        AND (j.closing_date IS NULL OR j.closing_date >= CURDATE())
        AND (e.profile_status = 'approved' OR e.profile_status IS NULL)
        AND (e.status = 'active' OR e.status IS NULL)
        AND j.title IS NOT NULL
        AND j.title != ''
      GROUP BY j.title
      ORDER BY count DESC, j.title ASC
      LIMIT 20`
    );

    // Format job titles as categories
    const categories = jobTitles.map((item: any) => ({
      name: item.title,
      count: item.count || 0
    }));

    return NextResponse.json({
      success: true,
      categories: categories
    });

  } catch (error: any) {
    console.error('Error fetching job titles:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch job titles', details: error?.message },
      { status: 500 }
    );
  }
}
