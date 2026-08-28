import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Get token from cookies or Authorization header
    const token = request.cookies.get('employerAuthToken')?.value || 
                  request.cookies.get('authToken')?.value ||
                  request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify token
    let decoded: any;
    try {
      decoded = verifyToken(token);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const employerId = decoded.sub || decoded.employerId || decoded.id;

    if (!employerId) {
      return NextResponse.json(
        { error: 'Invalid token: employer ID not found' },
        { status: 401 }
      );
    }

    // Convert employerId to integer for database comparison (database stores as INT)
    const employerIdInt = parseInt(String(employerId), 10);
    
    if (isNaN(employerIdInt)) {
      return NextResponse.json(
        { error: 'Invalid employer ID format' },
        { status: 400 }
      );
    }

    console.log('📊 Dashboard stats request:', {
      employerId,
      employerIdInt,
      decoded: JSON.stringify(decoded)
    });

    // Fetch dashboard statistics in parallel for better performance
    const [
      totalJobs,
      pendingJobs,
      activeJobs,
      totalApplications,
      shortlisted,
      interviews,
      placements,
      outstandingInvoices,
      totalRevenue
    ] = await Promise.all([
      // 1. Total Job Requirements
      executeQuery<{ count: number }>(
        `SELECT COUNT(*) as count FROM jobs WHERE employer_id = ?`,
        [employerIdInt]
      ),
      // 2. Pending Approvals
      executeQuery<{ count: number }>(
        `SELECT COUNT(*) as count FROM jobs 
         WHERE employer_id = ? 
         AND status IN ('draft', 'pending')`,
        [employerIdInt]
      ),
      // 3. Active Postings
      executeQuery<{ count: number }>(
        `SELECT COUNT(*) as count FROM jobs 
         WHERE employer_id = ? 
         AND status = 'published'`,
        [employerIdInt]
      ),
      // 4. Total Applications
      executeQuery<{ count: number }>(
        `SELECT COUNT(*) as count 
         FROM applications a
         INNER JOIN jobs j ON a.job_id = j.id
         WHERE j.employer_id = ?`,
        [employerIdInt]
      ),
      // 5. Shortlisted Candidates
      executeQuery<{ count: number }>(
        `SELECT COUNT(*) as count 
         FROM applications a
         INNER JOIN jobs j ON a.job_id = j.id
         WHERE j.employer_id = ? 
         AND a.status = 'shortlisted'`,
        [employerIdInt]
      ),
      // 6. Interviews Scheduled
      executeQuery<{ count: number }>(
        `SELECT COUNT(DISTINCT a.id) as count 
         FROM applications a
         INNER JOIN jobs j ON a.job_id = j.id
         WHERE j.employer_id = ? 
         AND (a.status = 'interviewed' OR a.status = 'screened')`,
        [employerIdInt]
      ),
      // 7. Placements
      executeQuery<{ count: number }>(
        `SELECT COUNT(*) as count 
         FROM applications a
         INNER JOIN jobs j ON a.job_id = j.id
         WHERE j.employer_id = ? 
         AND a.status = 'selected'`,
        [employerIdInt]
      ),
      // 8. Outstanding Invoices
      executeQuery<{ count: number }>(
        `SELECT COUNT(*) as count 
         FROM invoices 
         WHERE employer_id = ? 
         AND status IN ('sent', 'overdue', 'draft')`,
        [employerIdInt]
      ),
      // 9. Total Revenue (sum of paid invoices)
      executeQuery<{ total: number }>(
        `SELECT COALESCE(SUM(total_amount), 0) as total 
         FROM invoices 
         WHERE employer_id = ? 
         AND status = 'paid'`,
        [employerIdInt]
      )
    ]);

    const stats = {
      totalJobRequirements: totalJobs[0]?.count || 0,
      pendingApprovals: pendingJobs[0]?.count || 0,
      activeJobPostings: activeJobs[0]?.count || 0,
      totalApplications: totalApplications[0]?.count || 0,
      shortlistedCandidates: shortlisted[0]?.count || 0,
      interviewsScheduled: interviews[0]?.count || 0,
      placements: placements[0]?.count || 0,
      outstandingInvoices: outstandingInvoices[0]?.count || 0,
      totalRevenue: totalRevenue[0]?.total || 0
    };

    // Fetch recent activity - run queries in parallel for better performance
    const activities: any[] = [];

    try {
      // Run activity queries in parallel
      const [
        jobSubmissions,
        jobApprovals,
        applications,
        shortlistedCandidates
      ] = await Promise.all([
        // 1. Job submissions (jobs created)
        executeQuery<{
          id: number;
          title: string;
          created_at: Date;
        }>(
          `SELECT id, title, created_at 
           FROM jobs 
           WHERE employer_id = ? 
           ORDER BY created_at DESC 
           LIMIT 5`,
          [employerIdInt]
        ),
        // 2. Job approvals (jobs published)
        executeQuery<{
          id: number;
          title: string;
          posted_date: Date;
        }>(
          `SELECT id, title, posted_date 
           FROM jobs 
           WHERE employer_id = ? 
           AND status = 'published' 
           AND posted_date IS NOT NULL
           ORDER BY posted_date DESC 
           LIMIT 5`,
          [employerIdInt]
        ),
        // 3. Applications received
        executeQuery<{
          id: number;
          job_title: string;
          candidate_name: string;
          applied_date: Date;
        }>(
          `SELECT a.id, j.title as job_title, 
                  CONCAT(c.first_name, ' ', c.surname) as candidate_name,
                  a.applied_date
           FROM applications a
           INNER JOIN jobs j ON a.job_id = j.id
           INNER JOIN candidates c ON a.candidate_id = c.id
           WHERE j.employer_id = ?
           ORDER BY a.applied_date DESC
           LIMIT 10`,
          [employerIdInt]
        ),
        // 4. Candidates shortlisted
        executeQuery<{
          id: number;
          job_title: string;
          candidate_name: string;
          updated_at: Date;
        }>(
          `SELECT a.id, j.title as job_title,
                  CONCAT(c.first_name, ' ', c.surname) as candidate_name,
                  a.updated_at
           FROM applications a
           INNER JOIN jobs j ON a.job_id = j.id
           INNER JOIN candidates c ON a.candidate_id = c.id
           WHERE j.employer_id = ? 
           AND a.status = 'shortlisted'
           ORDER BY a.updated_at DESC
           LIMIT 5`,
          [employerIdInt]
        )
      ]);

      // Process job submissions
      jobSubmissions.forEach(job => {
        activities.push({
          id: `job_${job.id}`,
          type: 'job_submitted',
          title: 'Job Requirement Submitted',
          description: `New job requirement: ${job.title}`,
          timestamp: job.created_at,
          relatedId: job.id.toString()
        });
      });

      // Process job approvals
      jobApprovals.forEach(job => {
        activities.push({
          id: `job_approved_${job.id}`,
          type: 'job_approved',
          title: 'Job Approved and Published',
          description: `Job "${job.title}" has been approved and published`,
          timestamp: job.posted_date,
          relatedId: job.id.toString()
        });
      });

      // Process applications
      applications.forEach(app => {
        activities.push({
          id: `app_${app.id}`,
          type: 'application_received',
          title: 'New Application Received',
          description: `${app.candidate_name} applied for "${app.job_title}"`,
          timestamp: app.applied_date,
          relatedId: app.id.toString()
        });
      });

      // Process shortlisted candidates
      shortlistedCandidates.forEach(candidate => {
        activities.push({
          id: `shortlisted_${candidate.id}`,
          type: 'candidate_shortlisted',
          title: 'Candidate Shortlisted',
          description: `${candidate.candidate_name} was shortlisted for "${candidate.job_title}"`,
          timestamp: candidate.updated_at,
          relatedId: candidate.id.toString()
        });
      });
    } catch (error) {
      console.error('Error fetching basic activities:', error);
    }

    // Fetch additional activities in parallel
    try {
      const [
        interviews,
        placements,
        invoices
      ] = await Promise.all([
        // 5. Interviews scheduled
        executeQuery<{
          id: number;
          job_title: string;
          candidate_name: string;
          scheduled_date: Date;
        }>(
          `SELECT i.id, j.title as job_title,
                  CONCAT(c.first_name, ' ', c.surname) as candidate_name,
                  i.scheduled_date
           FROM interviews i
           INNER JOIN applications a ON i.application_id = a.id
           INNER JOIN jobs j ON a.job_id = j.id
           INNER JOIN candidates c ON a.candidate_id = c.id
           WHERE j.employer_id = ?
           ORDER BY i.scheduled_date DESC
           LIMIT 5`,
          [employerIdInt]
        ).catch(() => []), // Return empty array if table doesn't exist
        // 6. Placements made
        executeQuery<{
          id: number;
          job_title: string;
          candidate_name: string;
          updated_at: Date;
        }>(
          `SELECT a.id, j.title as job_title,
                  CONCAT(c.first_name, ' ', c.surname) as candidate_name,
                  a.updated_at
           FROM applications a
           INNER JOIN jobs j ON a.job_id = j.id
           INNER JOIN candidates c ON a.candidate_id = c.id
           WHERE j.employer_id = ?
           AND a.status = 'selected'
           ORDER BY a.updated_at DESC
           LIMIT 5`,
          [employerIdInt]
        ).catch(() => []),
        // 7. Invoices sent
        executeQuery<{
          id: number;
          invoice_number: string;
          candidate_name: string;
          job_title: string;
          created_at: Date;
        }>(
          `SELECT i.id, i.invoice_number,
                  CONCAT(c.first_name, ' ', c.surname) as candidate_name,
                  j.title as job_title,
                  i.created_at
           FROM invoices i
           INNER JOIN candidates c ON i.candidate_id = c.id
           INNER JOIN jobs j ON i.job_id = j.id
           WHERE i.employer_id = ?
           AND i.status IN ('sent', 'draft')
           ORDER BY i.created_at DESC
           LIMIT 5`,
          [employerIdInt]
        ).catch(() => [])
      ]);

      // Process interviews
      interviews.forEach((interview: any) => {
        activities.push({
          id: `interview_${interview.id}`,
          type: 'interview_scheduled',
          title: 'Interview Scheduled',
          description: `Interview scheduled for ${interview.candidate_name} - "${interview.job_title}"`,
          timestamp: interview.scheduled_date,
          relatedId: interview.id.toString()
        });
      });

      // Process placements
      placements.forEach((placement: any) => {
        activities.push({
          id: `placement_${placement.id}`,
          type: 'placement_made',
          title: 'Placement Made',
          description: `${placement.candidate_name} was placed for "${placement.job_title}"`,
          timestamp: placement.updated_at,
          relatedId: placement.id.toString()
        });
      });

      // Process invoices
      invoices.forEach((invoice: any) => {
        activities.push({
          id: `invoice_${invoice.id}`,
          type: 'invoice_sent',
          title: 'Invoice Sent',
          description: `Invoice ${invoice.invoice_number} sent for ${invoice.candidate_name} - "${invoice.job_title}"`,
          timestamp: invoice.created_at,
          relatedId: invoice.id.toString()
        });
      });
    } catch (error) {
      console.error('Error fetching additional activities:', error);
    }

    // Sort all activities by timestamp (most recent first) and limit to 20
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const recentActivity = activities.slice(0, 20);

    return NextResponse.json({
      success: true,
      data: {
        ...stats,
        recentActivity
      }
    });

  } catch (error: any) {
    console.error('Fetch employer dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics', details: error?.message },
      { status: 500 }
    );
  }
}

