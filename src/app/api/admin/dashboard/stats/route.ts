import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeSingleQuery } from '@/lib/database';

// GET - Fetch dashboard statistics
export async function GET(request: NextRequest) {
  try {
    // Run all simple COUNT queries in parallel for better performance
    const [
      candidatesResult,
      employersResult,
      applicationsResult,
      revenueResult,
      paymentsRevenueResult,
      pendingPaymentsResult
    ] = await Promise.all([
      // Total Candidates
      executeQuery<{ count: number }>(
        `SELECT COUNT(*) as count FROM candidates WHERE status = 'active'`
      ).catch(() => [{ count: 0 }]),
      
      // Total Employers
      executeQuery<{ count: number }>(
        `SELECT COUNT(*) as count 
         FROM employers 
         WHERE profile_status = 'approved' AND status = 'active'`
      ).catch(() => [{ count: 0 }]),
      
      // Pending Applications
      executeQuery<{ count: number }>(
        `SELECT COUNT(*) as count FROM applications WHERE status = 'pending'`
      ).catch(() => [{ count: 0 }]),
      
      // Total Revenue from invoices
      executeQuery<{ total: number }>(
        `SELECT COALESCE(SUM(total_amount), 0) as total 
         FROM invoices 
         WHERE status = 'paid'`
      ).catch(() => [{ total: 0 }]),
      
      // Total Revenue from payments (fallback)
      executeQuery<{ total: number }>(
        `SELECT COALESCE(SUM(amount), 0) as total 
         FROM payments 
         WHERE payment_status = 'completed'`
      ).catch(() => [{ total: 0 }]),
      
      // Pending Payments
      executeQuery<{ count: number }>(
        `SELECT COUNT(*) as count 
         FROM invoices 
         WHERE status = 'pending' OR status = 'overdue'`
      ).catch(() => [{ count: 0 }])
    ]);

    const totalCandidates = candidatesResult[0]?.count || 0;
    const totalEmployers = employersResult[0]?.count || 0;
    const pendingApplications = applicationsResult[0]?.count || 0;
    let totalRevenue = revenueResult[0]?.total || 0;
    if (totalRevenue === 0) {
      totalRevenue = paymentsRevenueResult[0]?.total || 0;
    }
    const pendingPayments = pendingPaymentsResult[0]?.count || 0;

    // Fetch recent candidates and employers in parallel
    const [recentCandidatesResult, recentEmployersResult] = await Promise.all([
      // Recent Candidates - simplified query
      executeQuery<any>(
        `SELECT 
          c.id,
          c.first_name,
          c.surname,
          c.email,
          c.phone,
          c.status,
          c.created_at,
          COALESCE(
            CONCAT_WS(', ', 
              NULLIF(cp.current_location_city, ''),
              NULLIF(cp.current_location_state, ''),
              NULLIF(cp.current_location_country, '')
            ),
            CONCAT_WS(', ', 
              NULLIF(cp.permanent_location_city, ''),
              NULLIF(cp.permanent_location_state, ''),
              NULLIF(cp.permanent_location_country, '')
            ),
            'N/A'
          ) as location,
          cp.photo_url as profile_picture
         FROM candidates c
         LEFT JOIN candidate_profiles cp ON c.id = cp.candidate_id
         WHERE c.status = 'active'
         ORDER BY c.created_at DESC 
         LIMIT 3`
      ).catch(() => []),
      
      // Recent Employers
      executeQuery<any>(
        `SELECT 
          id,
          company_name,
          email,
          mobile_phone,
          mobile_country_code,
          profile_status,
          status,
          industry,
          city,
          region,
          country,
          created_at,
          company_logo
         FROM employers 
         WHERE profile_status = 'approved' AND status = 'active'
         ORDER BY created_at DESC 
         LIMIT 3`
      ).catch(() => [])
    ]);

    const recentCandidates = recentCandidatesResult.map((c: any) => ({
      id: c.id?.toString() || '',
      name: `${c.first_name || ''} ${c.surname || ''}`.trim() || 'N/A',
      email: c.email || '',
      phone: c.phone || '',
      status: c.status || 'new',
      appliedDate: c.created_at ? new Date(c.created_at).toISOString() : new Date().toISOString(),
      location: c.location && c.location !== 'N/A' ? c.location : 'N/A',
      experience: 'N/A',
      avatar: c.profile_picture || null
    }));

    const recentEmployers = recentEmployersResult.map((e: any) => ({
      id: e.id,
      name: e.company_name || 'N/A',
      email: e.email || '',
      phone: e.mobile_phone ? `${e.mobile_country_code || ''}${e.mobile_phone}` : 'N/A',
      status: e.status || 'active',
      industry: e.industry || 'N/A',
      location: [e.city, e.region, e.country].filter(Boolean).join(', ') || 'N/A',
      joinedDate: e.created_at ? new Date(e.created_at).toISOString() : new Date().toISOString(),
      profileStatus: e.profile_status || 'approved',
      logo: e.company_logo || null
    }));

    // Fetch all recent activities for admin dashboard
    const activities: any[] = [];

    try {
      // Fetch activities from all employers (admin view)
      const [
        jobSubmissions,
        jobApprovals,
        applications,
        shortlistedCandidates,
        interviews,
        placements,
        invoices,
        candidateRegistrations,
        employerRegistrations,
        completedPayments
      ] = await Promise.all([
        // 1. Job submissions (all jobs created)
        executeQuery<{ id: number; title: string; created_at: Date }>(
          `SELECT id, title, created_at 
           FROM jobs 
           ORDER BY created_at DESC 
           LIMIT 10`
        ).catch(() => []),
        // 2. Job approvals (all jobs published)
        executeQuery<{ id: number; title: string; posted_date: Date }>(
          `SELECT id, title, posted_date 
           FROM jobs 
           WHERE status = 'published' 
           AND posted_date IS NOT NULL
           ORDER BY posted_date DESC 
           LIMIT 10`
        ).catch(() => []),
        // 3. Applications received (all applications)
        executeQuery<{ id: number; job_title: string; candidate_name: string; applied_date: Date }>(
          `SELECT a.id, j.title as job_title, 
                  CONCAT(c.first_name, ' ', c.surname) as candidate_name,
                  a.applied_date
           FROM applications a
           INNER JOIN jobs j ON a.job_id = j.id
           INNER JOIN candidates c ON a.candidate_id = c.id
           ORDER BY a.applied_date DESC
           LIMIT 15`
        ).catch(() => []),
        // 4. Candidates shortlisted (all shortlisted)
        executeQuery<{ id: number; job_title: string; candidate_name: string; updated_at: Date }>(
          `SELECT a.id, j.title as job_title,
                  CONCAT(c.first_name, ' ', c.surname) as candidate_name,
                  a.updated_at
           FROM applications a
           INNER JOIN jobs j ON a.job_id = j.id
           INNER JOIN candidates c ON a.candidate_id = c.id
           WHERE a.status = 'shortlisted'
           ORDER BY a.updated_at DESC
           LIMIT 10`
        ).catch(() => []),
        // 5. Interviews scheduled (all interviews)
        executeQuery<{ id: number; job_title: string; candidate_name: string; scheduled_date: Date }>(
          `SELECT i.id, j.title as job_title,
                  CONCAT(c.first_name, ' ', c.surname) as candidate_name,
                  i.scheduled_date
           FROM interviews i
           INNER JOIN applications a ON i.application_id = a.id
           INNER JOIN jobs j ON a.job_id = j.id
           INNER JOIN candidates c ON a.candidate_id = c.id
           ORDER BY i.scheduled_date DESC
           LIMIT 10`
        ).catch(() => []),
        // 6. Placements made (all placements)
        executeQuery<{ id: number; job_title: string; candidate_name: string; updated_at: Date }>(
          `SELECT a.id, j.title as job_title,
                  CONCAT(c.first_name, ' ', c.surname) as candidate_name,
                  a.updated_at
           FROM applications a
           INNER JOIN jobs j ON a.job_id = j.id
           INNER JOIN candidates c ON a.candidate_id = c.id
           WHERE a.status = 'selected'
           ORDER BY a.updated_at DESC
           LIMIT 10`
        ).catch(() => []),
        // 7. Invoices sent (all invoices)
        executeQuery<{ id: number; invoice_number: string; candidate_name: string; job_title: string; created_at: Date }>(
          `SELECT i.id, i.invoice_number,
                  CONCAT(c.first_name, ' ', c.surname) as candidate_name,
                  j.title as job_title,
                  i.created_at
           FROM invoices i
           INNER JOIN candidates c ON i.candidate_id = c.id
           INNER JOIN jobs j ON i.job_id = j.id
           ORDER BY i.created_at DESC
           LIMIT 10`
        ).catch(() => []),
        // 8. Candidate registrations
        executeQuery<{ id: number; name: string; created_at: Date }>(
          `SELECT id, CONCAT(first_name, ' ', surname) as name, created_at
           FROM candidates
           ORDER BY created_at DESC
           LIMIT 10`
        ).catch(() => []),
        // 9. Employer registrations
        executeQuery<{ id: number; name: string; created_at: Date }>(
          `SELECT id, company_name as name, created_at
           FROM employers
           ORDER BY created_at DESC
           LIMIT 10`
        ).catch(() => []),
        // 10. Completed payments - optimized with fewer JOINs
        executeQuery<{ 
          id: number; 
          amount: number; 
          currency: string; 
          candidate_name: string; 
          job_title: string; 
          company_name: string;
          payment_date: Date;
          invoice_number: string;
        }>(
          `SELECT 
            p.id, 
            p.amount, 
            p.currency, 
            COALESCE(p.payment_date, p.updated_at) as payment_date,
            COALESCE(CONCAT(c.first_name, ' ', c.surname), 'Unknown Candidate') as candidate_name,
            COALESCE(j.title, 'Unknown Job') as job_title,
            COALESCE(e.company_name, 'Unknown Company') as company_name,
            i.invoice_number
           FROM payments p
           LEFT JOIN offer_letters ol ON p.offer_letter_id = ol.id
           LEFT JOIN applications a ON ol.application_id = a.id
           LEFT JOIN candidates c ON a.candidate_id = c.id
           LEFT JOIN jobs j ON a.job_id = j.id
           LEFT JOIN employers e ON COALESCE(j.employer_id, p.employer_id) = e.id
           LEFT JOIN invoices i ON i.offer_letter_id = ol.id
           WHERE p.payment_status = 'completed'
           AND (p.payment_date IS NOT NULL OR p.updated_at IS NOT NULL)
           ORDER BY COALESCE(p.payment_date, p.updated_at) DESC
           LIMIT 10`
        ).catch(() => [])
      ]);

      // Process all activities
      jobSubmissions.forEach((job: any) => {
        activities.push({
          id: `job_${job.id}`,
          type: 'job_submitted',
          title: 'Job Requirement Submitted',
          description: `New job requirement: ${job.title}`,
          timestamp: job.created_at,
          relatedId: job.id.toString(),
          userType: 'employer'
        });
      });

      jobApprovals.forEach((job: any) => {
        activities.push({
          id: `job_approved_${job.id}`,
          type: 'job_approved',
          title: 'Job Approved and Published',
          description: `Job "${job.title}" has been approved and published`,
          timestamp: job.posted_date,
          relatedId: job.id.toString(),
          userType: 'admin'
        });
      });

      applications.forEach((app: any) => {
        activities.push({
          id: `app_${app.id}`,
          type: 'application_submitted',
          title: 'New Application Received',
          description: `${app.candidate_name} applied for "${app.job_title}"`,
          timestamp: app.applied_date,
          relatedId: app.id.toString(),
          userType: 'candidate'
        });
      });

      shortlistedCandidates.forEach((candidate: any) => {
        activities.push({
          id: `shortlisted_${candidate.id}`,
          type: 'candidate_shortlisted',
          title: 'Candidate Shortlisted',
          description: `${candidate.candidate_name} was shortlisted for "${candidate.job_title}"`,
          timestamp: candidate.updated_at,
          relatedId: candidate.id.toString(),
          userType: 'admin'
        });
      });

      interviews.forEach((interview: any) => {
        activities.push({
          id: `interview_${interview.id}`,
          type: 'interview_scheduled',
          title: 'Interview Scheduled',
          description: `Interview scheduled for ${interview.candidate_name} - "${interview.job_title}"`,
          timestamp: interview.scheduled_date,
          relatedId: interview.id.toString(),
          userType: 'admin'
        });
      });

      placements.forEach((placement: any) => {
        activities.push({
          id: `placement_${placement.id}`,
          type: 'placement_made',
          title: 'Placement Made',
          description: `${placement.candidate_name} was placed for "${placement.job_title}"`,
          timestamp: placement.updated_at,
          relatedId: placement.id.toString(),
          userType: 'admin'
        });
      });

      invoices.forEach((invoice: any) => {
        activities.push({
          id: `invoice_${invoice.id}`,
          type: 'invoice_generated',
          title: 'Invoice Generated',
          description: `Invoice ${invoice.invoice_number} generated for ${invoice.candidate_name} - "${invoice.job_title}"`,
          timestamp: invoice.created_at,
          relatedId: invoice.id.toString(),
          userType: 'admin'
        });
      });

      candidateRegistrations.forEach((candidate: any) => {
        activities.push({
          id: `candidate_reg_${candidate.id}`,
          type: 'candidate_registered',
          title: 'New Candidate Registered',
          description: `${candidate.name} registered on the platform`,
          timestamp: candidate.created_at,
          relatedId: candidate.id.toString(),
          userType: 'candidate'
        });
      });

      employerRegistrations.forEach((employer: any) => {
        activities.push({
          id: `employer_reg_${employer.id}`,
          type: 'employer_registered',
          title: 'New Employer Registered',
          description: `${employer.name} registered on the platform`,
          timestamp: employer.created_at,
          relatedId: employer.id.toString(),
          userType: 'employer'
        });
      });

      // Process completed payments
      completedPayments.forEach((payment: any) => {
        const formatCurrency = (amount: number, currency: string) => {
          const formatted = new Intl.NumberFormat('en-TZ', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
          }).format(amount);
          return `${currency} ${formatted}`;
        };
        
        activities.push({
          id: `payment_${payment.id}`,
          type: 'payment_completed',
          title: 'Payment Completed',
          description: `${payment.company_name || 'Employer'} paid ${formatCurrency(payment.amount, payment.currency || 'TZS')} for ${payment.candidate_name} - "${payment.job_title}"${payment.invoice_number ? ` (Invoice: ${payment.invoice_number})` : ''}`,
          timestamp: payment.payment_date,
          relatedId: payment.id.toString(),
          userType: 'employer'
        });
      });
    } catch (error) {
      console.error('Error fetching activities:', error);
    }

    // Sort all activities by timestamp (most recent first) and limit to 50
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const recentActivity = activities.slice(0, 50);

    // Fetch recent offers and payments
    let recentOffersAndPayments: any[] = [];
    try {
      const offersAndPayments = await executeQuery<{
        id: number;
        candidate_name: string;
        position_title: string;
        company_name: string;
        offer_amount: number;
        currency: string;
        candidate_response: string;
        payment_status: string;
        invoice_status: string;
        expiry_date: Date;
        created_at: Date;
        type: 'offer' | 'payment';
      }>(
        `SELECT 
          ol.id,
          CONCAT(c.first_name, ' ', c.surname) as candidate_name,
          ol.position_title,
          e.company_name,
          ol.offer_amount,
          COALESCE(i.currency, 'TZS') as currency,
          ol.candidate_response,
          p.payment_status,
          i.status as invoice_status,
          ol.expiry_date,
          ol.created_at,
          'offer' as type
        FROM offer_letters ol
        LEFT JOIN applications a ON ol.application_id = a.id
        LEFT JOIN candidates c ON a.candidate_id = c.id
        LEFT JOIN jobs j ON a.job_id = j.id
        LEFT JOIN employers e ON j.employer_id = e.id
        LEFT JOIN payments p ON p.offer_letter_id = ol.id
        LEFT JOIN invoices i ON i.offer_letter_id = ol.id
        WHERE ol.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        ORDER BY ol.created_at DESC
        LIMIT 10`
      );
      recentOffersAndPayments = offersAndPayments || [];
    } catch (error) {
      console.error('Error fetching recent offers and payments:', error);
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalCandidates,
        totalEmployers,
        pendingApplications,
        totalRevenue,
        pendingPayments
      },
      recentCandidates: recentCandidates || [],
      recentEmployers: recentEmployers || [],
      recentActivity: recentActivity || [],
      recentOffersAndPayments: recentOffersAndPayments || []
    });

  } catch (error: any) {
    console.error('Get dashboard stats error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch dashboard statistics', 
        details: error?.message 
      },
      { status: 500 }
    );
  }
}

