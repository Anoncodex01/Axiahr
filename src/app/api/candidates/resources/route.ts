import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';

// GET - Fetch active resources for candidates
export async function GET(request: NextRequest) {
  try {
    // Fetch only active resources targeted at candidates
    const resources = await executeQuery(
      `SELECT 
        id,
        title,
        description,
        image_url,
        content_type,
        display_order,
        link_url,
        link_text
      FROM resources_hub
      WHERE is_active = TRUE 
        AND (target_audience = 'candidates' OR target_audience = 'all')
      ORDER BY display_order ASC, created_at DESC
      LIMIT 10`,
      []
    );

    return NextResponse.json({
      success: true,
      data: resources,
      count: resources.length
    });
  } catch (error: any) {
    console.error('Error fetching candidate resources:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch resources' },
      { status: 500 }
    );
  }
}

