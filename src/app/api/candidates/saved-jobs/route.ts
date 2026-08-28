import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeSingleQuery } from '@/lib/database';
import { verifyToken } from '@/lib/auth';

// GET - Fetch all saved jobs for a candidate
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('authToken')?.value || 
                  request.cookies.get('candidateAuthToken')?.value ||
                  request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    let decoded: any;
    try {
      decoded = verifyToken(token);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const candidateId = decoded.sub || decoded.candidateId || decoded.id;

    const savedJobs = await executeQuery<any>(
      `SELECT 
        sj.id as saved_job_id,
        sj.saved_at,
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
        j.deadline,
        j.featured,
        e.company_name,
        e.industry,
        e.company_logo
      FROM saved_jobs sj
      INNER JOIN jobs j ON sj.job_id = j.id
      LEFT JOIN employers e ON j.employer_id = e.id
      WHERE sj.candidate_id = ?
        AND j.status = 'published'
        AND (j.deadline IS NULL OR j.deadline >= CURDATE())
        AND (j.closing_date IS NULL OR j.closing_date >= CURDATE())
      ORDER BY sj.saved_at DESC`,
      [candidateId]
    );

    // Format the results
    const formattedJobs = savedJobs.map((job: any) => {
      // Parse skills, requirements, benefits
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

      return {
        id: job.id.toString(),
        savedJobId: job.saved_job_id,
        savedAt: job.saved_at,
        title: job.title,
        company: job.company_name || '',
        companyLogo: job.company_logo || null,
        industry: job.industry || '',
        location: job.location || '',
        region: job.region || '',
        country: job.country || '',
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
        deadline: job.deadline ? new Date(job.deadline).toISOString() : null,
        featured: job.featured || false,
        description: job.description || '',
        skills: skills
      };
    });

    return NextResponse.json({
      success: true,
      savedJobs: formattedJobs
    });

  } catch (error: any) {
    console.error('Error fetching saved jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch saved jobs', details: error?.message },
      { status: 500 }
    );
  }
}

// POST - Save a job for a candidate
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('authToken')?.value || 
                  request.cookies.get('candidateAuthToken')?.value ||
                  request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    let decoded: any;
    try {
      decoded = verifyToken(token);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const candidateId = decoded.sub || decoded.candidateId || decoded.id;
    const body = await request.json();
    const { jobId } = body;

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    // Check if job exists and is published
    const jobCheck = await executeQuery(
      'SELECT id FROM jobs WHERE id = ? AND status = ?',
      [jobId, 'published']
    );

    if (jobCheck.length === 0) {
      return NextResponse.json(
        { error: 'Job not found or not available' },
        { status: 404 }
      );
    }

    // Check if already saved
    const existing = await executeQuery(
      'SELECT id FROM saved_jobs WHERE candidate_id = ? AND job_id = ?',
      [candidateId, jobId]
    );

    if (existing.length > 0) {
      return NextResponse.json({
        success: true,
        message: 'Job already saved',
        saved: true
      });
    }

    // Save the job
    await executeSingleQuery(
      'INSERT INTO saved_jobs (candidate_id, job_id) VALUES (?, ?)',
      [candidateId, jobId]
    );

    return NextResponse.json({
      success: true,
      message: 'Job saved successfully',
      saved: true
    });

  } catch (error: any) {
    console.error('Error saving job:', error);
    
    // Handle duplicate entry error
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({
        success: true,
        message: 'Job already saved',
        saved: true
      });
    }

    return NextResponse.json(
      { error: 'Failed to save job', details: error?.message },
      { status: 500 }
    );
  }
}

// DELETE - Unsave a job for a candidate
export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get('authToken')?.value || 
                  request.cookies.get('candidateAuthToken')?.value ||
                  request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    let decoded: any;
    try {
      decoded = verifyToken(token);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const candidateId = decoded.sub || decoded.candidateId || decoded.id;
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    // Delete the saved job
    const result = await executeSingleQuery(
      'DELETE FROM saved_jobs WHERE candidate_id = ? AND job_id = ?',
      [candidateId, jobId]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: 'Saved job not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Job unsaved successfully',
      saved: false
    });

  } catch (error: any) {
    console.error('Error unsaving job:', error);
    return NextResponse.json(
      { error: 'Failed to unsave job', details: error?.message },
      { status: 500 }
    );
  }
}
