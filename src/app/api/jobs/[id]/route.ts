import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';

// GET - Public endpoint to fetch a single published job by ID (no authentication required)
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
       WHERE j.id = ? 
         AND j.status = 'published'
         AND (e.profile_status = 'approved' OR e.profile_status IS NULL)
         AND (e.status = 'active' OR e.status IS NULL)`,
      [jobId]
    );

    if (jobs.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      );
    }

    const job = jobs[0];
    const deadlineValue = job.deadline || job.closing_date;
    const deadlineDate = deadlineValue ? new Date(deadlineValue) : null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const effectiveStatus = deadlineDate && deadlineDate < today ? 'expired' : (job.status || '');
    
    // Parse JSON fields
    let skills: string[] = [];
    try {
      if (job.skills) {
        skills = typeof job.skills === 'string' 
          ? JSON.parse(job.skills) 
          : job.skills;
      }
    } catch (error) {
      // If it's a comma-separated string, split it
      if (typeof job.skills === 'string') {
        skills = job.skills.split(',').map((s: string) => s.trim()).filter(Boolean);
      }
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

    // Format location
    const locationParts = [job.location, job.region, job.country].filter(Boolean);
    const location = locationParts.length > 0 ? locationParts.join(', ') : 'N/A';

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
        status: effectiveStatus,
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
        applicationsCount: 0, // Not needed for public view
        shortlistedCount: 0, // Not needed for public view
        aiEnhanced: job.ai_enhanced || false,
        featured: job.featured || false,
        skills: skills,
        description: job.description || '',
        requirements: parsedRequirements,
        benefits: parsedBenefits,
        location: location,
        maxHires: job.max_hires || null,
        currentHires: job.current_hires || 0,
        priority: job.priority || 'medium',
        createdAt: job.created_at ? new Date(job.created_at).toISOString() : null,
        updatedAt: job.updated_at ? new Date(job.updated_at).toISOString() : null
      }
    });

  } catch (error: any) {
    console.error('Get public job error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch job', details: error?.message },
      { status: 500 }
    );
  }
}
