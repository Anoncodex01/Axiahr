import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';

// GET - Fetch similar jobs based on current job
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;
    const limit = 5; // Limit to 5 similar jobs

    // First, get the current job details
    const currentJob = await executeQuery<any>(
      `SELECT 
        j.title,
        j.employment_type,
        j.experience_level,
        j.skills,
        j.region,
        j.country,
        e.industry as company_industry,
        e.id as employer_id
      FROM jobs j
      LEFT JOIN employers e ON j.employer_id = e.id
      WHERE j.id = ? AND j.status = 'published'
        AND (j.deadline IS NULL OR j.deadline >= CURDATE())
        AND (j.closing_date IS NULL OR j.closing_date >= CURDATE())`,
      [jobId]
    );

    if (currentJob.length === 0) {
      return NextResponse.json({
        success: true,
        similarJobs: []
      });
    }

    const job = currentJob[0];
    
    // Parse skills
    let skills: string[] = [];
    try {
      if (job.skills) {
        skills = typeof job.skills === 'string' 
          ? JSON.parse(job.skills) 
          : job.skills;
      }
    } catch (error) {
      if (typeof job.skills === 'string') {
        skills = job.skills.split(',').map((s: string) => s.trim()).filter(Boolean);
      }
    }

    // Build query to find similar jobs
    // Priority: same industry > similar title keywords > same experience level > same job type
    let query = `
      SELECT 
        j.id,
        j.title,
        j.description,
        j.employment_type,
        j.experience_level,
        j.years_of_experience,
        j.salary_min,
        j.salary_max,
        j.salary_currency,
        j.salary_range,
        j.location,
        j.region,
        j.country,
        j.posted_date,
        j.applications_count,
        j.employer_id,
        e.company_name,
        e.industry as company_industry,
        e.company_logo,
        CASE 
          WHEN EXISTS (
            SELECT 1 FROM employer_agreements ea
            WHERE ea.employer_id = j.employer_id
              AND ea.service_type = 'end-to-end'
              AND ea.status = 'signed'
              AND (ea.end_date IS NULL OR ea.end_date >= CURDATE())
          ) THEN 1
          ELSE 0
        END as is_end_to_end
      FROM jobs j
      LEFT JOIN employers e ON j.employer_id = e.id
      WHERE j.id != ?
        AND j.status = 'published'
        AND (j.deadline IS NULL OR j.deadline >= CURDATE())
        AND (j.closing_date IS NULL OR j.closing_date >= CURDATE())
        AND (e.profile_status = 'approved' OR e.profile_status IS NULL)
        AND (e.status = 'active' OR e.status IS NULL)
    `;
    const queryParams: any[] = [jobId];

    // Add conditions for similarity
    const conditions: string[] = [];
    
    // Same industry
    if (job.company_industry) {
      conditions.push(`e.industry = ?`);
      queryParams.push(job.company_industry);
    }
    
    // Similar title (extract keywords from title)
    const titleWords = job.title.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3);
    if (titleWords.length > 0) {
      const titlePattern = `%${titleWords[0]}%`;
      conditions.push(`(j.title LIKE ? OR j.description LIKE ?)`);
      queryParams.push(titlePattern, titlePattern);
    }
    
    // Same experience level
    if (job.experience_level) {
      conditions.push(`j.experience_level = ?`);
      queryParams.push(job.experience_level);
    }
    
    // Same job type
    if (job.employment_type) {
      conditions.push(`j.employment_type = ?`);
      queryParams.push(job.employment_type);
    }

    if (conditions.length > 0) {
      query += ` AND (${conditions.join(' OR ')})`;
    }

    query += ` ORDER BY 
      CASE WHEN e.industry = ? THEN 1 ELSE 2 END,
      CASE WHEN j.experience_level = ? THEN 1 ELSE 2 END,
      CASE WHEN j.employment_type = ? THEN 1 ELSE 2 END,
      j.posted_date DESC
      LIMIT ?`;
    
    queryParams.push(
      job.company_industry || '',
      job.experience_level || '',
      job.employment_type || '',
      limit
    );

    const similarJobs = await executeQuery<any>(query, queryParams);

    // Format the results
    const formattedJobs = similarJobs.map((job: any) => {
      const locationParts = [job.location, job.region, job.country].filter(Boolean);
      const location = locationParts.length > 0 ? locationParts.join(', ') : 'N/A';
      const isEndToEnd = job.is_end_to_end === 1 || job.is_end_to_end === true;

      return {
        id: job.id.toString(),
        title: job.title || '',
        company: isEndToEnd ? 'Axia HR Advisory' : (job.company_name || ''),
        companyLogo: isEndToEnd ? '/logo11.png' : (job.company_logo || null),
        isEndToEnd: isEndToEnd,
        location: location,
        jobType: job.employment_type?.replace('_', '-') || 'full-time',
        experience: job.experience_level || '',
        yearsOfExperience: job.years_of_experience || '',
        salary: {
          min: job.salary_min || 0,
          max: job.salary_max || 0,
          currency: job.salary_currency || 'TZS',
          range: job.salary_range || null
        },
        postedDate: job.posted_date ? new Date(job.posted_date).toISOString() : null,
        applicationsCount: job.applications_count || 0
      };
    });

    return NextResponse.json({
      success: true,
      similarJobs: formattedJobs
    });

  } catch (error: any) {
    console.error('Error fetching similar jobs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch similar jobs', details: error?.message },
      { status: 500 }
    );
  }
}
