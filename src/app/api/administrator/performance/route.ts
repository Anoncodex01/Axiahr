import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { executeQuery } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('administratorAuthToken')?.value ||
                  request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (decoded.type !== 'admin' || decoded.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get current date ranges
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    const lastMonth = new Date(today);
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    // Fetch employers metrics
    const [employersTotal] = await executeQuery<any>(
      'SELECT COUNT(*) as count FROM employers'
    );
    const [employersActive] = await executeQuery<any>(
      'SELECT COUNT(*) as count FROM employers WHERE status = "active"'
    );
    const [employersNewToday] = await executeQuery<any>(
      'SELECT COUNT(*) as count FROM employers WHERE DATE(created_at) = CURDATE()'
    );
    const [employersLastMonth] = await executeQuery<any>(
      'SELECT COUNT(*) as count FROM employers WHERE created_at >= ?',
      [lastMonth]
    );
    const [employersThisMonth] = await executeQuery<any>(
      'SELECT COUNT(*) as count FROM employers WHERE created_at >= DATE_FORMAT(NOW(), "%Y-%m-01")'
    );

    // Fetch candidates metrics
    const [candidatesTotal] = await executeQuery<any>(
      'SELECT COUNT(*) as count FROM candidates'
    );
    const [candidatesActive] = await executeQuery<any>(
      'SELECT COUNT(*) as count FROM candidates WHERE status = "active"'
    );
    const [candidatesNewToday] = await executeQuery<any>(
      'SELECT COUNT(*) as count FROM candidates WHERE DATE(created_at) = CURDATE()'
    );
    const [candidatesLastMonth] = await executeQuery<any>(
      'SELECT COUNT(*) as count FROM candidates WHERE created_at >= ?',
      [lastMonth]
    );
    const [candidatesThisMonth] = await executeQuery<any>(
      'SELECT COUNT(*) as count FROM candidates WHERE created_at >= DATE_FORMAT(NOW(), "%Y-%m-01")'
    );

    // Fetch jobs metrics
    const [jobsTotal] = await executeQuery<any>(
      'SELECT COUNT(*) as count FROM jobs'
    );
    const [jobsActive] = await executeQuery<any>(
      'SELECT COUNT(*) as count FROM jobs WHERE status = "active"'
    );
    const [jobsPostedToday] = await executeQuery<any>(
      'SELECT COUNT(*) as count FROM jobs WHERE DATE(created_at) = CURDATE()'
    );
    const [jobsLastMonth] = await executeQuery<any>(
      'SELECT COUNT(*) as count FROM jobs WHERE created_at >= ?',
      [lastMonth]
    );
    const [jobsThisMonth] = await executeQuery<any>(
      'SELECT COUNT(*) as count FROM jobs WHERE created_at >= DATE_FORMAT(NOW(), "%Y-%m-01")'
    );

    // Fetch applications metrics
    const [applicationsTotal] = await executeQuery<any>(
      'SELECT COUNT(*) as count FROM applications'
    );
    const [applicationsToday] = await executeQuery<any>(
      'SELECT COUNT(*) as count FROM applications WHERE DATE(created_at) = CURDATE()'
    );
    const [applicationsThisWeek] = await executeQuery<any>(
      'SELECT COUNT(*) as count FROM applications WHERE created_at >= ?',
      [lastWeek]
    );
    const [applicationsLastMonth] = await executeQuery<any>(
      'SELECT COUNT(*) as count FROM applications WHERE created_at >= ?',
      [lastMonth]
    );
    const [applicationsThisMonth] = await executeQuery<any>(
      'SELECT COUNT(*) as count FROM applications WHERE created_at >= DATE_FORMAT(NOW(), "%Y-%m-01")'
    );

    // Calculate growth percentages
    const employersGrowth = employersLastMonth[0]?.count > 0
      ? Math.round(((employersThisMonth[0]?.count || 0) - employersLastMonth[0].count) / employersLastMonth[0].count * 100)
      : 0;
    
    const candidatesGrowth = candidatesLastMonth[0]?.count > 0
      ? Math.round(((candidatesThisMonth[0]?.count || 0) - candidatesLastMonth[0].count) / candidatesLastMonth[0].count * 100)
      : 0;
    
    const jobsGrowth = jobsLastMonth[0]?.count > 0
      ? Math.round(((jobsThisMonth[0]?.count || 0) - jobsLastMonth[0].count) / jobsLastMonth[0].count * 100)
      : 0;
    
    const applicationsGrowth = applicationsLastMonth[0]?.count > 0
      ? Math.round(((applicationsThisMonth[0]?.count || 0) - applicationsLastMonth[0].count) / applicationsLastMonth[0].count * 100)
      : 0;

    // System performance metrics (placeholder - would need actual monitoring)
    const systemMetrics = {
      avgResponseTime: 150, // ms
      requestsPerMinute: 120,
      errorRate: 0.5, // percentage
      uptime: 30 // days
    };

    return NextResponse.json({
      metrics: {
        employers: {
          total: employersTotal[0]?.count || 0,
          active: employersActive[0]?.count || 0,
          newToday: employersNewToday[0]?.count || 0,
          growth: employersGrowth
        },
        candidates: {
          total: candidatesTotal[0]?.count || 0,
          active: candidatesActive[0]?.count || 0,
          newToday: candidatesNewToday[0]?.count || 0,
          growth: candidatesGrowth
        },
        jobs: {
          total: jobsTotal[0]?.count || 0,
          active: jobsActive[0]?.count || 0,
          postedToday: jobsPostedToday[0]?.count || 0,
          growth: jobsGrowth
        },
        applications: {
          total: applicationsTotal[0]?.count || 0,
          today: applicationsToday[0]?.count || 0,
          thisWeek: applicationsThisWeek[0]?.count || 0,
          growth: applicationsGrowth
        },
        system: systemMetrics
      }
    });
  } catch (error: any) {
    console.error('Error fetching performance metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch performance metrics', details: error.message },
      { status: 500 }
    );
  }
}

