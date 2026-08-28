import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeSingleQuery } from '@/lib/database';

// GET - Get single job by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;

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
        e.country
       FROM jobs j
       LEFT JOIN employers e ON j.employer_id = e.id
       WHERE j.id = ?`,
      [jobId]
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
        title: job.title,
        companyName: job.company_name || '',
        companyId: job.employer_id?.toString() || '',
        industry: job.company_industry || '',
        companyBrief: job.company_brief || '',
        companyLogo: job.company_logo || '',
        companyWebsite: job.website || '',
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
      }
    });

  } catch (error: any) {
    console.error('Get job error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job', details: error?.message },
      { status: 500 }
    );
  }
}

// PUT - Update job
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;
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
      status,
      featured,
      maxHires,
      priority,
      adminNotes
    } = body;

    // Check if job exists
    const existingJobs = await executeQuery(
      'SELECT id, employer_id FROM jobs WHERE id = ?',
      [jobId]
    );

    if (existingJobs.length === 0) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Check if employer exists if companyId is being changed
    if (companyId && companyId !== existingJobs[0].employer_id.toString()) {
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
    }

    // Build update query dynamically
    const updates: string[] = [];
    const updateParams: any[] = [];

    if (title !== undefined) {
      if (!title || title.trim() === '') {
        return NextResponse.json(
          { error: 'Title cannot be empty' },
          { status: 400 }
        );
      }
      updates.push('title = ?');
      updateParams.push(title.trim());
    }

    if (companyId !== undefined) {
      updates.push('employer_id = ?');
      updateParams.push(parseInt(companyId));
    }

    if (description !== undefined) {
      updates.push('description = ?');
      updateParams.push(description || null);
    }

    if (requirements !== undefined) {
      const requirementsText = Array.isArray(requirements) 
        ? JSON.stringify(requirements) 
        : (requirements || '');
      updates.push('requirements = ?');
      updateParams.push(requirementsText);
    }

    if (benefits !== undefined) {
      const benefitsText = Array.isArray(benefits) 
        ? JSON.stringify(benefits) 
        : (benefits || '');
      updates.push('benefits = ?');
      updateParams.push(benefitsText);
    }

    if (location !== undefined) {
      updates.push('location = ?');
      updateParams.push(location || null);
    }

    if (region !== undefined) {
      updates.push('region = ?');
      updateParams.push(region || null);
    }

    if (country !== undefined) {
      updates.push('country = ?');
      updateParams.push(country || null);
    }

    if (salary !== undefined) {
      const salaryMin = salary?.min || 0;
      const salaryMax = salary?.max || 0;
      const salaryCurrency = salary?.currency || 'TZS';
      const salaryRange = salaryMin && salaryMax 
        ? `${salaryCurrency} ${Number(salaryMin).toLocaleString()} - ${Number(salaryMax).toLocaleString()}`
        : null;
      
      updates.push('salary_range = ?');
      updates.push('salary_min = ?');
      updates.push('salary_max = ?');
      updates.push('salary_currency = ?');
      updateParams.push(
        salaryRange,
        salaryMin,
        salaryMax,
        salaryCurrency
      );
    }

    if (type !== undefined) {
      const employmentType = type?.replace('-', '_') || 'full_time';
      updates.push('employment_type = ?');
      updateParams.push(employmentType);
    }

    if (experience !== undefined) {
      updates.push('experience_level = ?');
      updateParams.push(experience || 'mid');
    }

    if (yearsOfExperience !== undefined) {
      updates.push('years_of_experience = ?');
      updateParams.push(yearsOfExperience || null);
    }

    if (education !== undefined) {
      updates.push('education = ?');
      updateParams.push(education || null);
    }

    if (certification !== undefined) {
      updates.push('certification = ?');
      updateParams.push(certification || null);
    }

    if (skills !== undefined) {
      const skillsJson = Array.isArray(skills) 
        ? JSON.stringify(skills) 
        : (skills ? JSON.stringify([skills]) : null);
      updates.push('skills = ?');
      updateParams.push(skillsJson);
    }

    if (deadline !== undefined) {
      updates.push('deadline = ?');
      updates.push('closing_date = ?');
      updateParams.push(deadline || null, deadline || null);
    }

    if (status !== undefined) {
      const validStatuses = ['draft', 'pending', 'published', 'paused', 'closed', 'expired', 'filled', 'rejected'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
          { status: 400 }
        );
      }
      updates.push('status = ?');
      updateParams.push(status);
      
      // Set posted_date if status is being changed to published
      if (status === 'published') {
        updates.push('posted_date = NOW()');
      }
    }

    if (featured !== undefined) {
      updates.push('featured = ?');
      updateParams.push(featured || false);
    }

    if (maxHires !== undefined) {
      updates.push('max_hires = ?');
      updateParams.push(maxHires || 1);
    }

    if (priority !== undefined) {
      const validPriorities = ['low', 'medium', 'high'];
      if (!validPriorities.includes(priority)) {
        return NextResponse.json(
          { error: `Invalid priority. Must be one of: ${validPriorities.join(', ')}` },
          { status: 400 }
        );
      }
      updates.push('priority = ?');
      updateParams.push(priority);
    }

    if (adminNotes !== undefined) {
      updates.push('admin_notes = ?');
      updateParams.push(adminNotes || null);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    updates.push('updated_at = NOW()');
    updateParams.push(jobId);

    await executeSingleQuery(
      `UPDATE jobs SET ${updates.join(', ')} WHERE id = ?`,
      updateParams
    );

    // Fetch updated job
    const updatedJobs = await executeQuery<any>(
      `SELECT 
        j.*,
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
       WHERE j.id = ?`,
      [jobId]
    );

    const job = updatedJobs[0];
    
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
      message: 'Job updated successfully',
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
    });

  } catch (error: any) {
    console.error('Update job error:', error);
    return NextResponse.json(
      { error: 'Failed to update job', details: error?.message },
      { status: 500 }
    );
  }
}

// DELETE - Move job to trash retention instead of permanently deleting it
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;

    // Check if job exists
    const existingJobs = await executeQuery(
      'SELECT id, title FROM jobs WHERE id = ?',
      [jobId]
    );

    if (existingJobs.length === 0) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    const trashNote = `[JOB_TRASH_UNTIL:${new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)}] Moved to Job Trash. Retain posting and application data for 90 days.`;

    // Soft-delete by closing the job and marking retention in admin notes.
    await executeSingleQuery(
      `UPDATE jobs
       SET status = 'closed',
           admin_notes = TRIM(CONCAT(COALESCE(admin_notes, ''), CASE WHEN COALESCE(admin_notes, '') = '' THEN '' ELSE '\n\n' END, ?)),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [trashNote, jobId]
    );

    return NextResponse.json({
      success: true,
      message: 'Job moved to trash. Posting and candidate application data will remain available for 90 days.'
    });

  } catch (error: any) {
    console.error('Move job to trash error:', error);

    return NextResponse.json(
      { error: 'Failed to move job to trash', details: error?.message },
      { status: 500 }
    );
  }
}
