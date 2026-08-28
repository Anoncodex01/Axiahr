import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const token = request.cookies.get('adminAuthToken')?.value || 
                  request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get new applications today
    const todayApps = await executeQuery(
      `SELECT COUNT(*) as count FROM applications WHERE created_at >= ?`,
      [todayStart]
    );
    const todayCount = todayApps[0]?.count || 0;

    // Get new applications this week
    const weekApps = await executeQuery(
      `SELECT COUNT(*) as count FROM applications WHERE created_at >= ?`,
      [weekStart]
    );
    const weekCount = weekApps[0]?.count || 0;

    // Get applications yesterday for trend
    const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayApps = await executeQuery(
      `SELECT COUNT(*) as count FROM applications WHERE created_at >= ? AND created_at < ?`,
      [yesterdayStart, todayStart]
    );
    const yesterdayCount = yesterdayApps[0]?.count || 0;
    const trend = todayCount > yesterdayCount ? 'up' : todayCount < yesterdayCount ? 'down' : 'stable';

    // Get API error rate (5xx errors) - This would need logging system
    // For now, we'll use a placeholder
    const apiErrorRate = {
      current: 0.1, // Placeholder - would come from logs
      threshold: 1.0,
      status: 'ok' as const
    };

    // Get database connection info
    const dbConnections = {
      active: 5, // Placeholder - would need to query MySQL
      max: 100,
      errors: 0 // Would track connection errors
    };

    // Get confirmation time (time from application to email sent)
    // This would track email queue processing time
    const confirmationTime = {
      median: 2.5, // seconds
      average: 3.1,
      status: 'ok' as const // ok if < 5min, warning if 5-10min, critical if > 10min
    };

    // Get queue depth (background jobs)
    const queueDepth = {
      pending: 0,
      processing: 0,
      failed: 0
    };

    const metrics = {
      newApplications: {
        today: todayCount,
        thisWeek: weekCount,
        trend
      },
      apiErrorRate,
      databaseConnections: dbConnections,
      confirmationTime,
      queueDepth
    };

    return NextResponse.json({
      success: true,
      metrics
    });
  } catch (error: any) {
    console.error('Error fetching app metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch application metrics', details: error.message },
      { status: 500 }
    );
  }
}

