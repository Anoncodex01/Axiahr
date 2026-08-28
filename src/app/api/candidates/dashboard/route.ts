import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { verifyToken } from '@/lib/auth';

// GET /api/candidates/dashboard - Get dashboard statistics for candidate
export async function GET(request: NextRequest) {
  try {
    // Get token from cookies or Authorization header (check both token names)
    const token = request.cookies.get('authToken')?.value || 
                  request.cookies.get('candidateAuthToken')?.value ||
                  request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify token
    let decoded: any;
    try {
      decoded = verifyToken(token);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const candidateId = decoded.sub || decoded.candidateId || decoded.id;

    if (!candidateId) {
      return NextResponse.json(
        { success: false, error: 'Candidate ID not found in token' },
        { status: 401 }
      );
    }

    // Get candidate basic info
    const candidateInfo = await executeQuery(`
      SELECT id, first_name, surname, email, phone
      FROM candidates
      WHERE id = ?
    `, [candidateId]);

    if (candidateInfo.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Candidate not found' },
        { status: 404 }
      );
    }

    const candidate = candidateInfo[0];

    // Get applications statistics
    const applicationsStats = await executeQuery(`
      SELECT 
        COUNT(*) as total_applications,
        SUM(CASE WHEN status = 'shortlisted' THEN 1 ELSE 0 END) as shortlisted_count,
        SUM(CASE WHEN status = 'selected' THEN 1 ELSE 0 END) as selected_count,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_count,
        SUM(CASE WHEN status = 'screened' THEN 1 ELSE 0 END) as screened_count
      FROM applications
      WHERE candidate_id = ?
    `, [candidateId]);

    const stats = applicationsStats[0] || {
      total_applications: 0,
      shortlisted_count: 0,
      selected_count: 0,
      rejected_count: 0,
      screened_count: 0
    };

    // Get interviews count
    const interviewsCount = await executeQuery(`
      SELECT COUNT(*) as total_interviews
      FROM interviews i
      JOIN applications a ON i.application_id = a.id
      WHERE a.candidate_id = ?
    `, [candidateId]);

    const totalInterviews = interviewsCount[0]?.total_interviews || 0;

    // Get recent applications (last 5)
    const recentApplications = await executeQuery(`
      SELECT 
        a.id,
        a.status,
        a.applied_date,
        j.title as job_title,
        j.location as job_location,
        j.employment_type,
        j.salary_min,
        j.salary_max,
        j.salary_currency,
        e.company_name
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      JOIN employers e ON j.employer_id = e.id
      WHERE a.candidate_id = ?
      ORDER BY a.applied_date DESC
      LIMIT 5
    `, [candidateId]);

    // Format recent applications
    const formattedApplications = recentApplications.map((app: any) => ({
      id: app.id.toString(),
      jobTitle: app.job_title,
      company: app.company_name,
      appliedDate: app.applied_date ? new Date(app.applied_date).toISOString() : null,
      status: app.status,
      location: app.job_location || 'Not specified',
      salary: app.salary_min && app.salary_max 
        ? `${app.salary_currency || 'TZS'} ${parseFloat(app.salary_min).toLocaleString()} - ${parseFloat(app.salary_max).toLocaleString()}`
        : 'Not specified',
      employmentType: app.employment_type
    }));

    // Get profile views (if you have a profile_views table, otherwise return 0)
    // For now, we'll return a placeholder or you can implement a profile_views tracking table
    const profileViews = 0; // TODO: Implement profile views tracking

    // Calculate changes (comparing last 30 days to previous 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];
    const sixtyDaysAgoStr = sixtyDaysAgo.toISOString().split('T')[0];

    const recentApplicationsCount = await executeQuery(`
      SELECT COUNT(*) as count
      FROM applications
      WHERE candidate_id = ? AND (applied_date >= ? OR (applied_date IS NULL AND created_at >= ?))
    `, [candidateId, thirtyDaysAgoStr, thirtyDaysAgoStr]);

    const previousApplicationsCount = await executeQuery(`
      SELECT COUNT(*) as count
      FROM applications
      WHERE candidate_id = ? AND (
        (applied_date >= ? AND applied_date < ?) OR 
        (applied_date IS NULL AND created_at >= ? AND created_at < ?)
      )
    `, [candidateId, sixtyDaysAgoStr, thirtyDaysAgoStr, sixtyDaysAgoStr, thirtyDaysAgoStr]);

    const recentCount = parseInt(recentApplicationsCount[0]?.count) || 0;
    const previousCount = parseInt(previousApplicationsCount[0]?.count) || 0;
    const applicationsChange = recentCount - previousCount;

    const recentShortlistedCount = await executeQuery(`
      SELECT COUNT(*) as count
      FROM applications
      WHERE candidate_id = ? AND status = 'shortlisted' AND (
        updated_at >= ? OR created_at >= ?
      )
    `, [candidateId, thirtyDaysAgoStr, thirtyDaysAgoStr]);

    const previousShortlistedCount = await executeQuery(`
      SELECT COUNT(*) as count
      FROM applications
      WHERE candidate_id = ? AND status = 'shortlisted' AND (
        (updated_at >= ? AND updated_at < ?) OR
        (updated_at IS NULL AND created_at >= ? AND created_at < ?)
      )
    `, [candidateId, sixtyDaysAgoStr, thirtyDaysAgoStr, sixtyDaysAgoStr, thirtyDaysAgoStr]);

    const recentShortlisted = parseInt(recentShortlistedCount[0]?.count) || 0;
    const previousShortlisted = parseInt(previousShortlistedCount[0]?.count) || 0;
    const shortlistedChange = recentShortlisted - previousShortlisted;

    return NextResponse.json({
      success: true,
      data: {
        candidate: {
          id: candidate.id,
          firstName: candidate.first_name,
          lastName: candidate.surname,
          email: candidate.email
        },
        statistics: {
          totalApplications: parseInt(stats.total_applications) || 0,
          shortlisted: parseInt(stats.shortlisted_count) || 0,
          selected: parseInt(stats.selected_count) || 0,
          interviews: parseInt(totalInterviews) || 0,
          profileViews: profileViews,
          applicationsChange: applicationsChange,
          shortlistedChange: shortlistedChange
        },
        recentApplications: formattedApplications
      }
    });

  } catch (error: any) {
    console.error('Error fetching candidate dashboard data:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}

