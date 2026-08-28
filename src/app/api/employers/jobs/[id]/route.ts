import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { verifyToken } from '@/lib/auth';

// GET - Get single job by ID for authenticated employer
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;

    // Get token from cookies or Authorization header
    const token = request.cookies.get('employerAuthToken')?.value || 
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

    const employerId = decoded.sub;

    const jobs = await executeQuery<any>(
      `SELECT 
        j.*,
        e.company_name,
        e.industry as company_industry,
        e.company_brief,
        e.company_logo,
        e.website,
        e.contact_person,
        e.first_name,
        e.last_name,
        e.job_title,
        e.email as company_email,
        e.mobile_phone,
        e.mobile_country_code,
        e.landline_phone,
        e.landline_country_code,
        e.city,
        e.region,
        e.country,
        (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.id) as applications_count,
        (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.id AND a.status = 'shortlisted') as shortlisted_count
       FROM jobs j
       LEFT JOIN employers e ON j.employer_id = e.id
       WHERE j.id = ? AND j.employer_id = ?`,
      [jobId, employerId]
    );

    if (jobs.length === 0) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    const job = jobs[0];
    
    // Parse JSON fields
    let skills: string[] = [];
    try {
      if (job.skills) {
        skills = typeof job.skills === 'string' 
          ? JSON.parse(job.skills) 
          : job.skills;
      }
    } catch (error) {
      skills = [];
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
      job: {
        id: job.id.toString(),
        title: job.title || '',
        companyName: job.company_name || '',
        companyId: job.employer_id?.toString() || '',
        industry: job.company_industry || '',
        companyBrief: job.company_brief || '',
        companyLogo: job.company_logo || null,
        companyWebsite: job.website || null,
        companyContactPerson: job.contact_person || '',
        companyContactFirstName: job.first_name || '',
        companyContactLastName: job.last_name || '',
        companyContactJobTitle: job.job_title || '',
        companyEmail: job.company_email || '',
        companyMobilePhone: job.mobile_phone || '',
        companyMobileCountryCode: job.mobile_country_code || '',
        companyLandlinePhone: job.landline_phone || '',
        companyLandlineCountryCode: job.landline_country_code || '',
        companyCity: job.city || '',
        companyRegion: job.region || '',
        companyCountry: job.country || '',
        region: job.region || '',
        country: job.country || '',
        type: job.employment_type?.replace('_', '-') || 'full-time',
        status: job.status || '',
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
        adminNotes: job.admin_notes || null,
        createdAt: job.created_at ? new Date(job.created_at).toISOString() : null,
        updatedAt: job.updated_at ? new Date(job.updated_at).toISOString() : null
      }
    });

  } catch (error: any) {
    console.error('Get employer job error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job', details: error?.message },
      { status: 500 }
    );
  }
}

// PUT - Update job by ID for authenticated employer
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;

    // Get token from cookies or Authorization header
    const token = request.cookies.get('employerAuthToken')?.value || 
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

    const employerId = decoded.sub;
    const body = await request.json();

    // Verify job belongs to employer
    const existingJobs = await executeQuery<any>(
      'SELECT id, employer_id FROM jobs WHERE id = ?',
      [jobId]
    );

    if (existingJobs.length === 0) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    if (existingJobs[0].employer_id.toString() !== employerId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Parse skills
    const skills = body.skills && Array.isArray(body.skills) 
      ? JSON.stringify(body.skills)
      : body.skills 
        ? JSON.stringify(body.skills.split(',').map((s: string) => s.trim()).filter((s: string) => s))
        : null;

    // Parse requirements and benefits
    const requirements = body.requirements && Array.isArray(body.requirements)
      ? JSON.stringify(body.requirements)
      : body.requirements
        ? JSON.stringify(body.requirements.split('\n').filter((r: string) => r.trim()))
        : null;

    const benefits = body.benefits && Array.isArray(body.benefits)
      ? JSON.stringify(body.benefits)
      : body.benefits
        ? JSON.stringify(body.benefits.split('\n').filter((b: string) => b.trim()))
        : null;

    // Update job
    await executeQuery(
      `UPDATE jobs SET
        title = ?,
        description = ?,
        requirements = ?,
        benefits = ?,
        location = ?,
        region = ?,
        country = ?,
        salary_min = ?,
        salary_max = ?,
        salary_currency = ?,
        employment_type = ?,
        experience_level = ?,
        years_of_experience = ?,
        education = ?,
        certification = ?,
        deadline = ?,
        skills = ?,
        updated_at = NOW()
      WHERE id = ? AND employer_id = ?`,
      [
        body.title,
        body.description || null,
        requirements,
        benefits,
        body.location || `${body.region || ''}, ${body.country || ''}`,
        body.region || null,
        body.country || null,
        body.salary?.min || 0,
        body.salary?.max || 0,
        body.salary?.currency || 'TZS',
        body.type?.replace('-', '_') || 'full_time',
        body.experience || null,
        body.yearsOfExperience || null,
        body.education || null,
        body.certification || null,
        body.deadline || null,
        skills,
        jobId,
        employerId
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Job updated successfully'
    });

  } catch (error: any) {
    console.error('Update employer job error:', error);
    return NextResponse.json(
      { error: 'Failed to update job', details: error?.message },
      { status: 500 }
    );
  }
}

