import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeSingleQuery } from '@/lib/database';
import { REFERENCES_ENABLED } from '@/utils/profileCompletion';

// GET /api/applications - Get all applications with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');
    const status = searchParams.get('status');
    const candidateId = searchParams.get('candidateId');
    const recruiterId = searchParams.get('recruiterId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        a.*,
        c.first_name,
        c.surname,
        c.email as candidate_email,
        c.phone as candidate_phone,
        cp.photo_url,
        j.title as job_title,
        j.location as job_location,
        j.employment_type as job_employment_type,
        j.salary_min as job_salary_min,
        j.salary_max as job_salary_max,
        j.salary_currency as job_salary_currency,
        e.company_name,
        e.industry as company_industry,
        u.first_name as recruiter_first_name,
        u.last_name as recruiter_last_name
      FROM applications a
      LEFT JOIN candidates c ON a.candidate_id = c.id
      LEFT JOIN candidate_profiles cp ON c.id = cp.candidate_id
      LEFT JOIN jobs j ON a.job_id = j.id
      LEFT JOIN employers e ON j.employer_id = e.id
      LEFT JOIN users u ON a.assigned_recruiter_id = u.id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    
    if (jobId) {
      query += ' AND a.job_id = ?';
      params.push(jobId);
    }
    
    if (status) {
      query += ' AND a.status = ?';
      params.push(status);
    }
    
    if (candidateId) {
      query += ' AND a.candidate_id = ?';
      params.push(candidateId);
    }
    
    if (recruiterId) {
      query += ' AND a.assigned_recruiter_id = ?';
      params.push(recruiterId);
    }
    
    query += ' ORDER BY a.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const applications = await executeQuery(query, params);

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM applications a WHERE 1=1';
    const countParams: any[] = [];
    
    if (jobId) {
      countQuery += ' AND a.job_id = ?';
      countParams.push(jobId);
    }
    
    if (status) {
      countQuery += ' AND a.status = ?';
      countParams.push(status);
    }
    
    if (candidateId) {
      countQuery += ' AND a.candidate_id = ?';
      countParams.push(candidateId);
    }
    
    if (recruiterId) {
      countQuery += ' AND a.assigned_recruiter_id = ?';
      countParams.push(recruiterId);
    }

    const countResult = await executeQuery(countQuery, countParams);
    const total = countResult[0]?.total || 0;

    return NextResponse.json({
      success: true,
      applications: applications,
      data: applications, // Keep both for compatibility
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching applications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch applications' },
      { status: 500 }
    );
  }
}

// POST /api/applications - Create new application
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      candidateId,
      jobId,
      experienceYears,
      skills,
      expectedSalary,
      noticePeriod,
      coverLetter,
      resumeUrl,
      portfolioUrl,
      linkedinUrl,
      githubUrl,
      source = 'direct'
    } = body;

    // Validate required fields
    if (!candidateId || !jobId) {
      return NextResponse.json(
        { error: 'Candidate ID and Job ID are required' },
        { status: 400 }
      );
    }

    const jobs = await executeQuery<any>(
      'SELECT id, title, status, deadline, closing_date FROM jobs WHERE id = ?',
      [jobId]
    );

    if (jobs.length === 0) {
      return NextResponse.json(
        { error: 'Job not found', rejectionReasons: ['The vacancy could not be found.'] },
        { status: 404 }
      );
    }

    const job = jobs[0];
    const deadlineValue = job.deadline || job.closing_date;
    const deadlineDate = deadlineValue ? new Date(deadlineValue) : null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadlineHasPassed = !!deadlineDate && deadlineDate < today;
    const closedStatuses = new Set(['closed', 'expired', 'filled', 'paused', 'rejected']);

    if (deadlineHasPassed && ['published', 'pending'].includes(job.status)) {
      try {
        await executeSingleQuery(
          'UPDATE jobs SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          ['expired', jobId]
        );
      } catch (error) {
        console.warn('Warning: Could not auto-expire job before application:', error);
      }
    }

    if (closedStatuses.has(job.status) || deadlineHasPassed) {
      const reason = deadlineHasPassed
        ? `The application deadline for "${job.title}" has passed.`
        : `This vacancy is ${job.status} and is no longer accepting applications.`;

      return NextResponse.json(
        {
          error: 'This vacancy is no longer accepting applications.',
          rejectionReasons: [reason],
          missingRequirements: [],
          jobStatus: deadlineHasPassed ? 'expired' : job.status
        },
        { status: 410 }
      );
    }

    // Check profile completion (must be at least 80%)
    const PROFILE_COMPLETION_THRESHOLD = 80;
    const profileData = await executeQuery(
      `SELECT 
        c.first_name, c.surname, c.email, c.gender, c.phone,
        cp.date_of_birth, cp.resume_headline, cp.profile_summary, cp.experience_type,
        cp.current_location_city, cp.current_location_state, cp.current_location_country,
        (SELECT COUNT(*) FROM candidate_experience WHERE candidate_id = ? AND experience_type = 'work') as experience_count,
        (SELECT COUNT(*) FROM candidate_experience WHERE candidate_id = ? AND experience_type IN ('internship', 'volunteer', 'volunteering')) as internship_count,
        (SELECT COUNT(*) FROM candidate_education WHERE candidate_id = ?) as education_count,
        (SELECT COUNT(*) FROM candidate_references WHERE candidate_id = ?) as references_count
      FROM candidates c
      LEFT JOIN candidate_profiles cp ON c.id = cp.candidate_id
      WHERE c.id = ?`,
      [candidateId, candidateId, candidateId, candidateId, candidateId]
    );

    if (profileData.length === 0) {
      return NextResponse.json(
        { error: 'Candidate not found' },
        { status: 404 }
      );
    }

    const profile = profileData[0];
    
    const missingRequirements: string[] = [];
    if (!profile.first_name || !profile.surname) missingRequirements.push('Name is required.');
    if (!profile.email) missingRequirements.push('Email is required.');
    if (!profile.phone) missingRequirements.push('Phone number is required.');
    if (!profile.date_of_birth) missingRequirements.push('Date of birth is required.');
    if (!profile.gender) missingRequirements.push('Gender is required.');
    if (!profile.resume_headline && !profile.profile_summary) missingRequirements.push('Add a resume headline or profile summary.');
    if (!(profile.experience_count > 0 || profile.internship_count > 0)) missingRequirements.push('Add at least one employment, internship, or volunteer experience.');
    if (profile.education_count <= 0) missingRequirements.push('Add at least one education entry.');
    // References are disabled for now, see REFERENCES_ENABLED
    if (REFERENCES_ENABLED && profile.references_count < 3) missingRequirements.push('Add three professional references.');
    if (!profile.current_location_city && !profile.current_location_state && !profile.current_location_country) missingRequirements.push('Add your current country, region/state, and district/city.');

    // Phase 1 completion: photo, house number, landmark, postal code, and administrative numbers are optional.
    const totalFields = REFERENCES_ENABLED ? 10 : 9;
    let completedFields = 0;

    // Essential personal and contact information (5 fields)
    if (profile.first_name && profile.surname) completedFields++;
    if (profile.email) completedFields++;
    if (profile.phone) completedFields++;
    if (profile.date_of_birth) completedFields++;
    if (profile.gender) completedFields++;

    // Profile content and experience
    if (profile.resume_headline || profile.profile_summary) completedFields++;
    if (profile.experience_count > 0 || profile.internship_count > 0) completedFields++;

    // Education, references, and simplified location
    if (profile.education_count > 0) completedFields++;
    if (REFERENCES_ENABLED && profile.references_count >= 3) completedFields++;
    if (profile.current_location_city || profile.current_location_state || profile.current_location_country) completedFields++;

    const completionPercentage = Math.round((completedFields / totalFields) * 100);

    if (completionPercentage < PROFILE_COMPLETION_THRESHOLD) {
      return NextResponse.json(
        { 
          error: `Your profile is only ${completionPercentage}% complete. Please complete at least ${PROFILE_COMPLETION_THRESHOLD}% of your profile before applying for jobs.`,
          completionPercentage,
          requiredPercentage: PROFILE_COMPLETION_THRESHOLD,
          missingRequirements,
          rejectionReasons: missingRequirements,
          guidance: 'Profile photo, house number, landmark, postal code, and administrative numbers are optional for phase 1.'
        },
        { status: 403 }
      );
    }

    // Check if application already exists
    const existingApplication = await executeQuery(
      'SELECT id FROM applications WHERE candidate_id = ? AND job_id = ?',
      [candidateId, jobId]
    );

    if (existingApplication.length > 0) {
      return NextResponse.json(
        { error: 'Application already exists for this candidate and job' },
        { status: 409 }
      );
    }

    // Create application
    const result = await executeSingleQuery(`
      INSERT INTO applications (
        candidate_id, job_id, experience_years, skills, expected_salary,
        notice_period, cover_letter, resume_url, portfolio_url, linkedin_url,
        github_url, source, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `, [
      candidateId, jobId, experienceYears, JSON.stringify(skills || []),
      expectedSalary, noticePeriod, coverLetter, resumeUrl, portfolioUrl,
      linkedinUrl, githubUrl, source
    ]);

    const applicationId = result.insertId;

    // Log status change
    try {
      await executeSingleQuery(`
        INSERT INTO application_status_history (application_id, new_status, changed_by, change_reason)
        VALUES (?, 'pending', ?, 'Application submitted')
      `, [applicationId, candidateId]);
    } catch (error) {
      console.warn('Warning: Could not log status change:', error);
      // Continue even if status history fails
    }

    // Create notification for admin (optional - don't fail if table doesn't exist)
    try {
      await executeSingleQuery(`
        INSERT INTO notifications (recipient_id, recipient_type, type, title, message, data)
        VALUES (?, 'admin', 'application_received', 'New Application Received', ?, ?)
      `, [
        1, // Assuming admin user ID is 1
        `New application received for job ${jobId}`,
        JSON.stringify({ applicationId, candidateId, jobId })
      ]);
    } catch (error) {
      console.warn('Warning: Could not create notification (notifications table may not exist):', error);
      // Continue even if notification creation fails
    }

    return NextResponse.json({
      success: true,
      applicationId,
      message: 'Application submitted successfully'
    });

  } catch (error) {
    console.error('Error creating application:', error);
    const message = error instanceof Error ? error.message : '';
    if (message.includes('ETIMEDOUT') || message.includes('ECONNREFUSED') || message.includes('DB Query Failed')) {
      return NextResponse.json(
        {
          error: 'The database is currently unavailable, so we could not submit the application. Please try again once the backend connection is restored.',
          rejectionReasons: ['Database connection timed out before the application could be saved.'],
          details: message
        },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create application' },
      { status: 500 }
    );
  }
}

// PUT /api/applications/[id] - Update application status
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get('id');
    const body = await request.json();
    const { status, adminNotes, assignedRecruiterId, changedBy, rejectionReason } = body;

    if (!applicationId) {
      return NextResponse.json(
        { error: 'Application ID is required' },
        { status: 400 }
      );
    }

    // Get current status
    const currentApp = await executeQuery(
      'SELECT status FROM applications WHERE id = ?',
      [applicationId]
    );

    if (currentApp.length === 0) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    const oldStatus = currentApp[0].status;

    // Update application
    const updateFields = [];
    const updateValues = [];

    if (status) {
      updateFields.push('status = ?');
      updateValues.push(status);
    }

    if (adminNotes !== undefined && rejectionReason === undefined) {
      updateFields.push('admin_notes = ?');
      updateValues.push(adminNotes);
    }

    if (rejectionReason !== undefined) {
      updateFields.push('admin_notes = ?');
      updateValues.push(adminNotes ? `${adminNotes}\n\nRejection reason: ${rejectionReason}` : `Rejection reason: ${rejectionReason}`);
    }

    if (assignedRecruiterId !== undefined) {
      updateFields.push('assigned_recruiter_id = ?');
      updateValues.push(assignedRecruiterId);
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    updateValues.push(applicationId);

    await executeSingleQuery(`
      UPDATE applications SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, updateValues);

    // Log status change if status changed
    if (status && status !== oldStatus) {
      await executeSingleQuery(`
        INSERT INTO application_status_history (application_id, old_status, new_status, changed_by, change_reason)
        VALUES (?, ?, ?, ?, ?)
      `, [applicationId, oldStatus, status, changedBy || 1, rejectionReason || adminNotes || 'Status updated by admin']);
    }

    return NextResponse.json({
      success: true,
      message: 'Application updated successfully'
    });

  } catch (error) {
    console.error('Error updating application:', error);
    return NextResponse.json(
      { error: 'Failed to update application' },
      { status: 500 }
    );
  }
}
