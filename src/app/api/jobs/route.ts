import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';

// GET - Public endpoint to fetch published jobs (no authentication required)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const location = searchParams.get('location') || '';
    const experience = searchParams.get('experience') || '';
    const jobType = searchParams.get('jobType') || '';
    const industry = searchParams.get('industry') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Build query - only fetch published jobs
    let query = `
      SELECT 
        j.id,
        j.title,
        j.description,
        j.requirements,
        j.benefits,
        j.location,
        j.region,
        j.country,
        j.salary_min,
        j.salary_max,
        j.salary_currency,
        j.employment_type,
        j.experience_level,
        j.years_of_experience,
        j.education,
        j.certification,
        j.skills,
        j.posted_date,
        j.deadline,
        j.featured,
        j.ai_enhanced,
        e.company_name,
        e.industry as company_industry,
        e.company_brief,
        e.company_logo
      FROM jobs j
      LEFT JOIN employers e ON j.employer_id = e.id
      WHERE j.status = 'published'
        AND (j.deadline IS NULL OR j.deadline >= CURDATE())
        AND (j.closing_date IS NULL OR j.closing_date >= CURDATE())
        AND (e.profile_status = 'approved' OR e.profile_status IS NULL)
        AND (e.status = 'active' OR e.status IS NULL)
    `;
    const params: any[] = [];

    // Search filter
    if (search) {
      query += ' AND (j.title LIKE ? OR j.description LIKE ? OR e.company_name LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    // Location filter
    if (location) {
      query += ' AND (j.location LIKE ? OR j.region LIKE ? OR j.country LIKE ?)';
      const locationPattern = `%${location}%`;
      params.push(locationPattern, locationPattern, locationPattern);
    }

    // Experience filter
    if (experience) {
      query += ' AND j.experience_level = ?';
      params.push(experience);
    }

    // Job type filter
    if (jobType) {
      query += ' AND j.employment_type = ?';
      params.push(jobType);
    }

    // Industry filter
    if (industry) {
      query += ' AND e.industry LIKE ?';
      params.push(`%${industry}%`);
    }

    // Get total count for pagination
    const countQuery = query.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM').replace(/ORDER BY[\s\S]*$/, '');
    const countResult = await executeQuery<{ total: number }>(countQuery, params);
    const total = countResult[0]?.total || 0;

    // Add ordering and pagination
    query += ' ORDER BY j.featured DESC, j.posted_date DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const jobs = await executeQuery<any>(query, params);

    // Parse JSON fields and format response
    const formattedJobs = jobs.map((job: any) => {
      let skills: string[] = [];
      let requirements: string[] = [];
      let benefits: string[] = [];

      try {
        if (job.skills) {
          skills = typeof job.skills === 'string' ? JSON.parse(job.skills) : job.skills;
        }
      } catch (error) {
        skills = [];
      }

      try {
        if (job.requirements) {
          if (typeof job.requirements === 'string' && job.requirements.startsWith('[')) {
            requirements = JSON.parse(job.requirements);
          } else {
            requirements = job.requirements.split('\n').filter((r: string) => r.trim());
          }
        }
      } catch (error) {
        requirements = job.requirements ? [job.requirements] : [];
      }

      try {
        if (job.benefits) {
          if (typeof job.benefits === 'string' && job.benefits.startsWith('[')) {
            benefits = JSON.parse(job.benefits);
          } else {
            benefits = job.benefits.split('\n').filter((b: string) => b.trim());
          }
        }
      } catch (error) {
        benefits = job.benefits ? [job.benefits] : [];
      }

      return {
        id: job.id.toString(),
        title: job.title || '',
        company: job.company_name || '',
        companyId: job.employer_id?.toString() || '',
        location: [job.location, job.region, job.country].filter(Boolean).join(', ') || 'N/A',
        salary: {
          min: job.salary_min || 0,
          max: job.salary_max || 0,
          currency: job.salary_currency || 'TZS'
        },
        jobType: job.employment_type?.replace('_', '-') || 'full-time',
        experience: job.experience_level || '',
        yearsOfExperience: job.years_of_experience || '',
        industry: job.company_industry || '',
        education: job.education || '',
        description: job.description || '',
        requirements: requirements,
        benefits: benefits,
        skills: skills,
        postedDate: job.posted_date 
          ? (job.posted_date instanceof Date 
              ? job.posted_date.toISOString() 
              : new Date(job.posted_date).toISOString())
          : null,
        deadline: job.deadline ? new Date(job.deadline).toISOString() : null,
        featured: job.featured || false,
        aiEnhanced: job.ai_enhanced || false,
        companyLogo: job.company_logo || null,
        companyBrief: job.company_brief || ''
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
    console.error('Get public jobs error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch jobs', details: error?.message },
      { status: 500 }
    );
  }
}
