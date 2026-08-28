import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';

// GET /api/employer/screened-candidates - Get screened candidates for employer
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');
    const employerId = searchParams.get('employerId');

    if (!employerId) {
      return NextResponse.json(
        { error: 'Employer ID is required' },
        { status: 400 }
      );
    }

    // Build query to get screened candidates with evaluations
    let query = `
      SELECT 
        e.id as evaluation_id,
        e.overall_score,
        e.communication_skills,
        e.technical_skills,
        e.experience as experience_rating,
        e.cultural_fit,
        e.leadership,
        e.strengths,
        e.weaknesses,
        e.additional_notes,
        e.recommendation,
        e.current_salary,
        e.expected_salary,
        e.availability,
        e.interviewer_notes,
        e.sent_to_employer,
        e.sent_to_employer_date,
        e.created_at as evaluation_date,
        a.id as application_id,
        a.candidate_id,
        a.job_id,
        a.status as application_status,
        a.applied_date,
        a.cover_letter,
        a.resume_url,
        c.first_name,
        c.surname as last_name,
        c.email as candidate_email,
        c.phone as candidate_phone,
        cp.photo_url,
        cp.resume_headline,
        cp.profile_summary,
        cp.total_experience_years,
        cp.nationality,
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
          ''
        ) as current_location,
        j.title as job_title,
        j.location as job_location,
        j.employment_type,
        j.salary_min,
        j.salary_max,
        j.salary_currency,
        u.first_name as interviewer_first_name,
        u.last_name as interviewer_last_name,
        i.scheduled_date as interview_date
      FROM evaluations e
      INNER JOIN applications a ON e.application_id = a.id
      INNER JOIN jobs j ON a.job_id = j.id
      INNER JOIN candidates c ON a.candidate_id = c.id
      LEFT JOIN candidate_profiles cp ON c.id = cp.candidate_id
      LEFT JOIN users u ON e.interviewer_id = u.id
      LEFT JOIN interviews i ON e.interview_id = i.id
      WHERE j.employer_id = ?
        AND e.sent_to_employer = TRUE
        AND (e.recommendation = 'meets' OR e.recommendation = 'exceeds')
    `;

    const params: any[] = [employerId];

    if (jobId) {
      query += ' AND a.job_id = ?';
      params.push(jobId);
    }

    query += ' ORDER BY COALESCE(e.sent_to_employer_date, e.created_at) DESC, e.created_at DESC';

    let candidates;
    try {
      candidates = await executeQuery(query, params);
    } catch (queryError: any) {
      console.error('Database query error:', queryError);
      throw new Error(`Database query failed: ${queryError.message || queryError.sqlMessage || 'Unknown error'}`);
    }

    // Fetch skills for all candidates
    const candidateIds = [...new Set(candidates.map((c: any) => c.candidate_id))];
    let skillsMap: Record<number, string[]> = {};
    
    if (candidateIds.length > 0) {
      try {
        const placeholders = candidateIds.map(() => '?').join(',');
        const skills = await executeQuery(
          `SELECT candidate_id, skill_name FROM candidate_skills WHERE candidate_id IN (${placeholders})`,
          candidateIds
        );
        
        skills.forEach((skill: any) => {
          if (!skillsMap[skill.candidate_id]) {
            skillsMap[skill.candidate_id] = [];
          }
          skillsMap[skill.candidate_id].push(skill.skill_name);
        });
      } catch (skillsError) {
        console.error('Error fetching skills:', skillsError);
        // Don't fail the whole request if skills fetch fails
      }
    }

    // Map to response format (hide contact details from employer)
    const mappedCandidates = candidates.map((c: any) => ({
      id: c.application_id?.toString() || '',
      candidateId: c.candidate_id?.toString() || '',
      candidateName: `${c.first_name || ''} ${c.surname || ''}`.trim(),
      // Contact details hidden - employer should contact through Axia
      jobId: c.job_id?.toString() || '',
      jobTitle: c.job_title || '',
      jobLocation: c.job_location || '',
      appliedDate: c.applied_date || '',
      experience: c.total_experience_years ? `${c.total_experience_years} years` : 'Not specified',
      resumeUrl: c.resume_url || '',
      profilePicture: c.photo_url || '',
      resumeHeadline: c.resume_headline || '',
      profileSummary: c.profile_summary || '',
      nationality: c.nationality || '',
      currentLocation: c.current_location || '',
      skills: skillsMap[c.candidate_id] || [],
      evaluation: {
        id: c.evaluation_id?.toString() || '',
        score: c.overall_score || 0,
        recommendation: c.recommendation || 'partially_meets',
        strengths: c.strengths || '',
        weaknesses: c.weaknesses || '',
        communicationSkills: c.communication_skills || '',
        technicalSkills: c.technical_skills || '',
        experience: c.experience_rating || '',
        culturalFit: c.cultural_fit || '',
        leadership: c.leadership || '',
        currentSalary: c.current_salary || '',
        expectedSalary: c.expected_salary || '',
        availability: c.availability || '',
        interviewerNotes: c.interviewer_notes || '',
        additionalNotes: c.additional_notes || '',
        interviewerName: c.interviewer_first_name && c.interviewer_last_name 
          ? `${c.interviewer_first_name} ${c.interviewer_last_name}` 
          : '',
        submittedAt: c.evaluation_date || '',
        interviewDate: c.interview_date || ''
      },
      status: c.application_status || 'screened',
      coverLetter: c.cover_letter || ''
    }));

    return NextResponse.json({
      success: true,
      data: mappedCandidates,
      count: mappedCandidates.length
    });

  } catch (error: any) {
    console.error('Error fetching screened candidates:', error);
    const errorMessage = error?.message || 'Failed to fetch screened candidates';
    return NextResponse.json(
      { 
        success: false,
        error: errorMessage,
        details: error?.sqlMessage || error?.code || 'Unknown database error'
      },
      { status: 500 }
    );
  }
}

