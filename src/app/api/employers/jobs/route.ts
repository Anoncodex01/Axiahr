import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeSingleQuery } from '@/lib/database';
import { verifyToken } from '@/lib/auth';

// GET - Fetch jobs for the authenticated employer
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
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    // Build query
    let query = `
      SELECT 
        j.id,
        j.employer_id,
        j.title,
        j.description,
        j.requirements,
        j.benefits,
        j.location,
        j.region,
        j.country,
        j.salary_range,
        j.salary_min,
        j.salary_max,
        j.salary_currency,
        j.employment_type,
        j.experience_level,
        j.years_of_experience,
        j.education,
        j.certification,
        j.skills,
        j.status,
        j.max_hires,
        j.current_hires,
        j.featured,
        j.ai_enhanced,
        j.posted_date,
        j.closing_date,
        j.deadline,
        j.applications_count,
        j.views_count,
        j.shortlisted_count,
        j.interviewed_count,
        j.hired_count,
        j.priority,
        j.admin_notes,
        j.created_at,
        j.updated_at,
        e.company_name,
        e.industry as company_industry,
        e.company_brief
      FROM jobs j
      LEFT JOIN employers e ON j.employer_id = e.id
      WHERE j.employer_id = ?
    `;
    const params: any[] = [employerId];

    if (status && status !== 'all') {
      if (status === 'expired') {
        // For expired, check both status='expired' OR deadline has passed
        query += ` AND (j.status = 'expired' OR (j.deadline IS NOT NULL AND j.deadline < CURDATE() AND j.status IN ('published', 'pending')))`;
      } else {
        query += ' AND j.status = ?';
        params.push(status);
      }
    } else {
      // When showing all, also include jobs that should be marked as expired
      // We'll mark them in the response but don't filter them out
    }

    if (search) {
      query += ' AND (j.title LIKE ? OR j.description LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern);
    }

    query += ' ORDER BY j.created_at DESC';

    const jobs = await executeQuery<any>(query, params);
    
    // Auto-update expired jobs and mark them in response
    const today = new Date().toISOString().split('T')[0];
    for (const job of jobs) {
      if (job.deadline && job.deadline < today && job.status === 'published') {
        // Auto-update status to expired
        try {
          await executeQuery(
            'UPDATE jobs SET status = ? WHERE id = ? AND employer_id = ?',
            ['expired', job.id, employerId]
          );
          job.status = 'expired';
        } catch (error) {
          console.error('Error updating expired job:', error);
        }
      }
    }

    // Parse JSON fields
    const formattedJobs = jobs.map((job: any) => {
      let skills: string[] = [];
      try {
        if (job.skills) {
          skills = typeof job.skills === 'string' ? JSON.parse(job.skills) : job.skills;
        }
      } catch (e) {
        console.error('Error parsing skills:', e);
      }

      let requirements: string[] = [];
      try {
        if (job.requirements) {
          requirements = typeof job.requirements === 'string' ? JSON.parse(job.requirements) : job.requirements;
        }
      } catch (e) {
        console.error('Error parsing requirements:', e);
      }

      let benefits: string[] = [];
      try {
        if (job.benefits) {
          benefits = typeof job.benefits === 'string' ? JSON.parse(job.benefits) : job.benefits;
        }
      } catch (e) {
        console.error('Error parsing benefits:', e);
      }

      // Check if job should be marked as expired (deadline passed but status not updated)
      let jobStatus = job.status || 'draft';
      if (job.deadline && new Date(job.deadline) < new Date() && jobStatus === 'published') {
        jobStatus = 'expired';
      }
      
      return {
        id: job.id.toString(),
        title: job.title,
        companyName: job.company_name,
        companyId: job.employer_id.toString(),
        industry: job.company_industry || '',
        companyBrief: job.company_brief || '',
        region: job.region || '',
        country: job.country || '',
        type: job.employment_type || 'full-time',
        status: jobStatus,
        salary: {
          min: job.salary_min || 0,
          max: job.salary_max || 0,
          currency: job.salary_currency || 'TZS'
        },
        experience: job.experience_level || '',
        yearsOfExperience: job.years_of_experience || '',
        education: job.education || '',
        certification: job.certification || '',
        postedDate: job.posted_date ? new Date(job.posted_date).toISOString() : null,
        deadline: job.deadline ? new Date(job.deadline).toISOString() : null,
        applicationsCount: job.applications_count || 0,
        adminNotes: job.admin_notes || null,
        shortlistedCount: job.shortlisted_count || 0,
        aiEnhanced: job.ai_enhanced || false,
        featured: job.featured || false,
        skills: skills,
        description: job.description || '',
        requirements: requirements,
        benefits: benefits
      };
    });

    return NextResponse.json({
      success: true,
      jobs: formattedJobs
    });

  } catch (error: any) {
    console.error('Get employer jobs error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs', details: error?.message },
      { status: 500 }
    );
  }
}

// POST - Create a new job posting
export async function POST(request: NextRequest) {
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
    const body = await request.json();

    const {
      title,
      description,
      requirements,
      benefits,
      region,
      country,
      salary,
      type,
      experience,
      yearsOfExperience,
      education,
      certification,
      deadline,
      skills,
      priority
    } = body;

    // Validation
    if (!title || !description) {
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      );
    }

    // Check if employer has signed agreement
    const agreementCheck = await executeQuery<any>(
      `SELECT id FROM employer_agreements 
       WHERE employer_id = ? AND status = 'signed' 
       ORDER BY created_at DESC LIMIT 1`,
      [employerId]
    );

    if (agreementCheck.length === 0) {
      return NextResponse.json(
        { error: 'You must sign an agreement before posting jobs' },
        { status: 403 }
      );
    }

    // Convert job type from 'full-time' to 'full_time' format for database
    const employmentType = (type || 'full-time').replace('-', '_');
    
    // Calculate salary range string
    const salaryMin = salary?.min || 0;
    const salaryMax = salary?.max || 0;
    const salaryCurrency = salary?.currency || 'TZS';
    const salaryRange = salaryMin && salaryMax 
      ? `${salaryCurrency} ${Number(salaryMin).toLocaleString()} - ${Number(salaryMax).toLocaleString()}`
      : null;

    // Set priority default to 'medium' if not provided
    const jobPriority = priority || 'medium';

    // Insert job with 'pending' status for admin approval
    const result = await executeSingleQuery(
      `INSERT INTO jobs (
        employer_id,
        title,
        description,
        requirements,
        benefits,
        region,
        country,
        location,
        salary_range,
        salary_min,
        salary_max,
        salary_currency,
        employment_type,
        experience_level,
        years_of_experience,
        education,
        certification,
        skills,
        status,
        priority,
        deadline,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, NOW(), NOW())`,
      [
        employerId,
        title.trim(),
        description.trim(),
        JSON.stringify(Array.isArray(requirements) ? requirements : (requirements || [])),
        JSON.stringify(Array.isArray(benefits) ? benefits : (benefits || [])),
        region || null,
        country || null,
        region && country ? `${region}, ${country}` : (region || country || null),
        salaryRange,
        salaryMin,
        salaryMax,
        salaryCurrency,
        employmentType,
        experience || null,
        yearsOfExperience || null,
        education || null,
        certification || null,
        JSON.stringify(Array.isArray(skills) ? skills : (skills || [])),
        jobPriority,
        deadline || null
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Job posted successfully. It will be reviewed by admin before being published.',
      data: {
        jobId: result.insertId.toString(),
        status: 'pending'
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error('Create employer job error:', error);
    return NextResponse.json(
      { error: 'Failed to create job posting', details: error?.message },
      { status: 500 }
    );
  }
}

