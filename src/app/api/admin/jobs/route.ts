import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeSingleQuery } from '@/lib/database';

// GET - Fetch all jobs with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const employerId = searchParams.get('employerId');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    // Build query with filters
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
        j.created_by,
        j.created_at,
        j.updated_at,
        e.company_name,
        e.industry as company_industry,
        e.company_brief,
        e.contact_person,
        e.email as company_email,
        e.mobile_phone,
        e.mobile_country_code,
        e.landline_phone,
        e.landline_country_code
      FROM jobs j
      LEFT JOIN employers e ON j.employer_id = e.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status && status !== 'all') {
      if (status === 'expired') {
        // For expired, check both status='expired' OR deadline has passed
        query += ` AND (j.status = 'expired' OR (j.deadline IS NOT NULL AND j.deadline < CURDATE() AND j.status IN ('published', 'pending')))`;
      } else if (status === 'trash') {
        query += ` AND j.admin_notes LIKE '%[JOB_TRASH_UNTIL:%'`;
      } else {
        query += ' AND j.status = ?';
        params.push(status);
      }
    } else {
      // When showing all, also include jobs that should be marked as expired
      // We'll mark them in the response but don't filter them out
    }

    if (employerId && employerId !== 'all') {
      query += ' AND j.employer_id = ?';
      params.push(parseInt(employerId));
    }

    if (search) {
      query += ' AND (j.title LIKE ? OR j.description LIKE ? OR e.company_name LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    // Get total count for pagination
    const countQuery = query.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM').replace(/ORDER BY[\s\S]*$/, '');
    const countResult = await executeQuery<{ total: number }>(countQuery, params);
    const total = countResult[0]?.total || 0;

    // Add pagination and ordering
    query += ' ORDER BY j.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const jobs = await executeQuery<any>(query, params);
    
    // Auto-update expired jobs and mark them in response
    const today = new Date().toISOString().split('T')[0];
    for (const job of jobs) {
      if (job.deadline && job.deadline < today && job.status === 'published') {
        // Auto-update status to expired
        try {
          await executeQuery(
            'UPDATE jobs SET status = ? WHERE id = ?',
            ['expired', job.id]
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
          skills = typeof job.skills === 'string' 
            ? JSON.parse(job.skills) 
            : job.skills;
        }
      } catch (error) {
        console.error('Failed to parse skills:', error);
        skills = [];
      }

      // Parse requirements and benefits if they're JSON strings
      let parsedRequirements: string[] = [];
      let parsedBenefits: string[] = [];
      
      try {
        if (job.requirements) {
          if (typeof job.requirements === 'string' && job.requirements.startsWith('[')) {
            parsedRequirements = JSON.parse(job.requirements);
          } else {
            parsedRequirements = job.requirements.split('\n').filter((r: string) => r.trim());
          }
        }
      } catch (error) {
        parsedRequirements = job.requirements ? [job.requirements] : [];
      }

      try {
        if (job.benefits) {
          if (typeof job.benefits === 'string' && job.benefits.startsWith('[')) {
            parsedBenefits = JSON.parse(job.benefits);
          } else {
            parsedBenefits = job.benefits.split('\n').filter((b: string) => b.trim());
          }
        }
      } catch (error) {
        parsedBenefits = job.benefits ? [job.benefits] : [];
      }

      // Check if job should be marked as expired (deadline passed but status not updated)
      let jobStatus = job.status || 'draft';
      if (job.deadline && new Date(job.deadline) < new Date() && jobStatus === 'published') {
        jobStatus = 'expired';
      }
      
      return {
        id: job.id.toString(),
        title: job.title,
        companyName: job.company_name || '',
        companyId: job.employer_id?.toString() || '',
        industry: job.company_industry || '',
        companyBrief: job.company_brief || '',
        region: job.region || '',
        country: job.country || '',
        type: job.employment_type?.replace('_', '-') || 'full-time',
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
        deadline: job.deadline || job.closing_date ? (job.deadline || job.closing_date) : null,
        applicationsCount: job.applications_count || 0,
        shortlistedCount: job.shortlisted_count || 0,
        aiEnhanced: job.ai_enhanced || false,
        featured: job.featured || false,
        skills: skills,
        description: job.description || '',
        requirements: parsedRequirements,
        benefits: parsedBenefits,
        location: job.location || '',
        maxHires: job.max_hires || 1,
        currentHires: job.current_hires || 0,
        priority: job.priority || 'medium',
        adminNotes: job.admin_notes || '',
        createdAt: job.created_at ? new Date(job.created_at).toISOString() : null,
        updatedAt: job.updated_at ? new Date(job.updated_at).toISOString() : null
      };
    });

    return NextResponse.json({
      success: true,
      jobs: formattedJobs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error: any) {
    console.error('Get jobs error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs', details: error?.message },
      { status: 500 }
    );
  }
}

// POST - Create new job
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      companyId,
      description,
      requirements,
      benefits,
      location,
      region,
      country,
      salary,
      type,
      experience,
      yearsOfExperience,
      education,
      certification,
      skills,
      deadline,
      status = 'draft',
      featured = false,
      maxHires = 1,
      priority = 'medium',
      adminNotes
    } = body;

    // Validation
    if (!title || !companyId) {
      return NextResponse.json(
        { error: 'Title and company are required' },
        { status: 400 }
      );
    }

    // Check if employer exists
    const employers = await executeQuery(
      'SELECT id FROM employers WHERE id = ?',
      [parseInt(companyId)]
    );

    if (employers.length === 0) {
      return NextResponse.json(
        { error: 'Employer not found' },
        { status: 404 }
      );
    }

    // Prepare data
    const employmentType = type?.replace('-', '_') || 'full_time';
    const experienceLevel = experience || 'mid';
    
    // Parse requirements and benefits
    const requirementsText = Array.isArray(requirements) 
      ? JSON.stringify(requirements) 
      : (requirements || '');
    
    const benefitsText = Array.isArray(benefits) 
      ? JSON.stringify(benefits) 
      : (benefits || '');

    const skillsJson = Array.isArray(skills) 
      ? JSON.stringify(skills) 
      : (skills ? JSON.stringify([skills]) : null);

    // Determine posted_date based on status
    const postedDate = status === 'published' ? new Date() : null;

    // Calculate salary range string
    const salaryMin = salary?.min || 0;
    const salaryMax = salary?.max || 0;
    const salaryCurrency = salary?.currency || 'TZS';
    const salaryRange = salaryMin && salaryMax 
      ? `${salaryCurrency} ${Number(salaryMin).toLocaleString()} - ${Number(salaryMax).toLocaleString()}`
      : null;

    // Set priority default to 'medium' if not provided
    const jobPriority = priority || 'medium';

    // Create job
    const result = await executeSingleQuery(
      `INSERT INTO jobs (
        employer_id, title, description, requirements, benefits, location, region, country,
        salary_range, salary_min, salary_max, salary_currency,
        employment_type, experience_level, years_of_experience, education, certification, skills,
        status, featured, max_hires, priority, admin_notes, posted_date, closing_date, deadline
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        parseInt(companyId),
        title.trim(),
        description || null,
        requirementsText,
        benefitsText,
        location || null,
        region || null,
        country || null,
        salaryRange,
        salaryMin,
        salaryMax,
        salaryCurrency,
        employmentType,
        experienceLevel,
        yearsOfExperience || null,
        education || null,
        certification || null,
        skillsJson,
        status,
        featured || false,
        maxHires || 1,
        jobPriority,
        adminNotes || null,
        postedDate,
        deadline || null,
        deadline || null
      ]
    );

    // Fetch the created job
    const newJobs = await executeQuery<any>(
      `SELECT j.*, e.company_name, e.industry as company_industry, e.company_brief
       FROM jobs j
       LEFT JOIN employers e ON j.employer_id = e.id
       WHERE j.id = ?`,
      [result.insertId]
    );

    if (newJobs.length === 0) {
      return NextResponse.json(
        { error: 'Failed to retrieve created job' },
        { status: 500 }
      );
    }

    const job = newJobs[0];
    
    // Parse JSON fields
    let parsedSkills: string[] = [];
    try {
      if (job.skills) {
        parsedSkills = typeof job.skills === 'string' 
          ? JSON.parse(job.skills) 
          : job.skills;
      }
    } catch (error) {
      parsedSkills = [];
    }

    let parsedRequirements: string[] = [];
    let parsedBenefits: string[] = [];
    
    try {
      if (job.requirements) {
        if (typeof job.requirements === 'string' && job.requirements.startsWith('[')) {
          parsedRequirements = JSON.parse(job.requirements);
        } else {
          parsedRequirements = job.requirements.split('\n').filter((r: string) => r.trim());
        }
      }
    } catch (error) {
      parsedRequirements = job.requirements ? [job.requirements] : [];
    }

    try {
      if (job.benefits) {
        if (typeof job.benefits === 'string' && job.benefits.startsWith('[')) {
          parsedBenefits = JSON.parse(job.benefits);
        } else {
          parsedBenefits = job.benefits.split('\n').filter((b: string) => b.trim());
        }
      }
    } catch (error) {
      parsedBenefits = job.benefits ? [job.benefits] : [];
    }

    return NextResponse.json({
      success: true,
      message: 'Job created successfully',
      job: {
        id: job.id.toString(),
        title: job.title,
        companyName: job.company_name || '',
        companyId: job.employer_id?.toString() || '',
        industry: job.company_industry || '',
        companyBrief: job.company_brief || '',
        region: job.region || '',
        country: job.country || '',
        type: job.employment_type?.replace('_', '-') || 'full-time',
        status: job.status || 'draft',
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
        deadline: job.deadline || job.closing_date ? (job.deadline || job.closing_date) : null,
        applicationsCount: job.applications_count || 0,
        shortlistedCount: job.shortlisted_count || 0,
        aiEnhanced: job.ai_enhanced || false,
        featured: job.featured || false,
        skills: parsedSkills,
        description: job.description || '',
        requirements: parsedRequirements,
        benefits: parsedBenefits,
        location: job.location || '',
        maxHires: job.max_hires || 1,
        currentHires: job.current_hires || 0,
        priority: job.priority || 'medium',
        adminNotes: job.admin_notes || '',
        createdAt: job.created_at ? new Date(job.created_at).toISOString() : null,
        updatedAt: job.updated_at ? new Date(job.updated_at).toISOString() : null
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error('Create job error:', error);
    return NextResponse.json(
      { error: 'Failed to create job', details: error?.message },
      { status: 500 }
    );
  }
}
