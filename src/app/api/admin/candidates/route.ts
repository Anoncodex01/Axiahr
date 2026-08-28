import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';

// GET - Fetch all candidates with filtering and search
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const id = searchParams.get('id');

    // If fetching a single candidate by ID
    if (id) {
      const candidateResult = await executeQuery<any>(
        `SELECT 
          c.id,
          c.first_name,
          c.middle_name,
          c.surname,
          c.email,
          c.phone,
          c.alternate_phone,
          c.whatsapp_phone,
          c.gender,
          c.status,
          c.email_verified,
          c.profile_completed,
          c.created_at,
          c.updated_at,
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
            'N/A'
          ) as location,
          cp.current_location_city,
          cp.current_location_state,
          cp.current_location_country,
          cp.permanent_location_city,
          cp.permanent_location_state,
          cp.permanent_location_country,
          cp.current_address_house_no,
          cp.current_address_street_name,
          cp.current_address_landmark,
          cp.current_address_postal_code,
          cp.permanent_address_house_no,
          cp.permanent_address_street_name,
          cp.permanent_address_landmark,
          cp.permanent_address_postal_code,
          cp.nationality,
          cp.origin,
          cp.marital_status,
          cp.date_of_birth,
          cp.photo_url,
          cp.resume_headline,
          cp.profile_summary,
          cp.experience_type,
          cp.total_experience_years,
          cp.total_experience_months,
          cp.is_open_for_relocation
         FROM candidates c
         LEFT JOIN candidate_profiles cp ON c.id = cp.candidate_id
         WHERE c.id = ?`,
        [id]
      );

      if (candidateResult.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Candidate not found' },
          { status: 404 }
        );
      }

      const candidate = candidateResult[0];

      // Fetch preferred locations
      let preferredLocations: any[] = [];
      try {
        const preferredLocationsResult = await executeQuery<any>(
          'SELECT location_string FROM candidate_preferred_locations WHERE candidate_id = ? ORDER BY display_order ASC',
          [id]
        );
        preferredLocations = preferredLocationsResult;
      } catch (error) {
        console.log('Preferred locations table might not exist or error fetching:', error);
        preferredLocations = [];
      }

      // Fetch skills
      let skills: any[] = [];
      try {
        const skillsResult = await executeQuery<any>(
          'SELECT skill_name FROM candidate_skills WHERE candidate_id = ? ORDER BY created_at DESC',
          [id]
        );
        skills = skillsResult;
      } catch (error) {
        console.log('Skills table might not exist or error fetching skills:', error);
        skills = [];
      }

      // Fetch experience count
      let experienceCount = [{ count: 0 }];
      try {
        const experienceCountResult = await executeQuery<{ count: number }>(
          'SELECT COUNT(*) as count FROM candidate_experience WHERE candidate_id = ?',
          [id]
        );
        experienceCount = experienceCountResult;
      } catch (error) {
        console.log('Experience table might not exist or error fetching:', error);
        experienceCount = [{ count: 0 }];
      }

      // Fetch education count
      let educationCount = [{ count: 0 }];
      try {
        const educationCountResult = await executeQuery<{ count: number }>(
          'SELECT COUNT(*) as count FROM candidate_education WHERE candidate_id = ?',
          [id]
        );
        educationCount = educationCountResult;
      } catch (error) {
        console.log('Education table might not exist or error fetching:', error);
        educationCount = [{ count: 0 }];
      }

      // Fetch all related data
      let experiences: any[] = [];
      let education: any[] = [];
      let languages: any[] = [];
      let salary: any[] = [];
      let references: any[] = [];
      let projects: any[] = [];
      let accomplishments: any[] = [];
      let certifications: any[] = [];
      let onlinePresence: any[] = [];
      let jobPreferences: any[] = [];
      let resume: any[] = [];

      try {
        experiences = await executeQuery<any>(
          'SELECT * FROM candidate_experience WHERE candidate_id = ? ORDER BY start_date DESC',
          [id]
        );
      } catch (error) {
        console.log('Error fetching experiences:', error);
      }

      try {
        education = await executeQuery<any>(
          'SELECT * FROM candidate_education WHERE candidate_id = ? ORDER BY start_date DESC',
          [id]
        );
      } catch (error) {
        console.log('Error fetching education:', error);
      }

      try {
        languages = await executeQuery<any>(
          'SELECT * FROM candidate_languages WHERE candidate_id = ? ORDER BY created_at DESC',
          [id]
        );
      } catch (error) {
        console.log('Error fetching languages:', error);
      }

      try {
        salary = await executeQuery<any>(
          'SELECT * FROM candidate_salary WHERE candidate_id = ?',
          [id]
        );
      } catch (error) {
        console.log('Error fetching salary:', error);
      }

      try {
        references = await executeQuery<any>(
          'SELECT * FROM candidate_references WHERE candidate_id = ? ORDER BY created_at DESC',
          [id]
        );
      } catch (error) {
        console.log('Error fetching references:', error);
      }

      try {
        projects = await executeQuery<any>(
          'SELECT * FROM candidate_projects WHERE candidate_id = ? ORDER BY start_date DESC',
          [id]
        );
      } catch (error) {
        console.log('Error fetching projects:', error);
      }

      try {
        accomplishments = await executeQuery<any>(
          'SELECT * FROM candidate_accomplishments WHERE candidate_id = ? ORDER BY year DESC',
          [id]
        );
      } catch (error) {
        console.log('Error fetching accomplishments:', error);
      }

      try {
        certifications = await executeQuery<any>(
          'SELECT * FROM candidate_certifications WHERE candidate_id = ? ORDER BY year_of_completion DESC',
          [id]
        );
      } catch (error) {
        console.log('Error fetching certifications:', error);
      }

      try {
        onlinePresence = await executeQuery<any>(
          'SELECT * FROM candidate_online_presence WHERE candidate_id = ?',
          [id]
        );
      } catch (error) {
        console.log('Error fetching online presence:', error);
      }

      try {
        jobPreferences = await executeQuery<any>(
          'SELECT * FROM candidate_job_preferences WHERE candidate_id = ?',
          [id]
        );
      } catch (error) {
        console.log('Error fetching job preferences:', error);
      }

      try {
        resume = await executeQuery<any>(
          'SELECT * FROM candidate_resume WHERE candidate_id = ?',
          [id]
        );
      } catch (error) {
        console.log('Error fetching resume:', error);
      }

      return NextResponse.json({
        success: true,
        candidate: {
          id: candidate.id.toString(),
          firstName: candidate.first_name || '',
          middleName: candidate.middle_name || '',
          surname: candidate.surname || '',
          email: candidate.email || '',
          phone: candidate.phone || '',
          alternatePhone: candidate.alternate_phone || '',
          whatsapp: candidate.whatsapp_phone || '',
          gender: candidate.gender || '',
          status: candidate.status || 'pending',
          emailVerified: candidate.email_verified || false,
          profileCompleted: candidate.profile_completed || false,
          location: candidate.location || 'N/A',
          currentLocation: {
            city: candidate.current_location_city ? candidate.current_location_city.replace(/^["']|["']$/g, '') : '',
            state: candidate.current_location_state || '',
            country: candidate.current_location_country || ''
          },
          permanentLocation: {
            city: candidate.permanent_location_city ? candidate.permanent_location_city.replace(/^["']|["']$/g, '') : '',
            state: candidate.permanent_location_state || '',
            country: candidate.permanent_location_country || ''
          },
          currentAddress: {
            houseNo: candidate.current_address_house_no || '',
            streetName: candidate.current_address_street_name || '',
            landmark: candidate.current_address_landmark || '',
            postalCode: candidate.current_address_postal_code || ''
          },
          permanentAddress: {
            houseNo: candidate.permanent_address_house_no || '',
            streetName: candidate.permanent_address_street_name || '',
            landmark: candidate.permanent_address_landmark || '',
            postalCode: candidate.permanent_address_postal_code || ''
          },
          nationality: candidate.nationality || '',
          origin: candidate.origin || '',
          maritalStatus: candidate.marital_status || '',
          dateOfBirth: candidate.date_of_birth || null,
          profilePicture: candidate.photo_url || null,
          resumeHeadline: candidate.resume_headline || '',
          profileSummary: candidate.profile_summary || '',
          experienceType: candidate.experience_type || 'fresher',
          totalExperienceYears: candidate.total_experience_years || 0,
          totalExperienceMonths: candidate.total_experience_months || 0,
          isOpenForRelocation: candidate.is_open_for_relocation === 'yes',
          preferredLocations: preferredLocations.map((loc: any) => loc.location_string || ''),
          skills: skills.map((skill: any) => ({
            name: skill.skill_name || '',
            proficiency: '' // proficiency_level column doesn't exist in candidate_skills table
          })),
          experienceCount: experienceCount[0]?.count || 0,
          educationCount: educationCount[0]?.count || 0,
          experiences: experiences || [],
          education: education || [],
          languages: languages || [],
          salary: salary[0] || null,
          references: references || [],
          projects: projects || [],
          accomplishments: accomplishments || [],
          certifications: certifications || [],
          onlinePresence: onlinePresence[0] || null,
          jobPreferences: jobPreferences[0] || null,
          resume: resume[0] || null,
          createdAt: candidate.created_at ? new Date(candidate.created_at).toISOString() : null,
          updatedAt: candidate.updated_at ? new Date(candidate.updated_at).toISOString() : null
        }
      });
    }

    // Fetch all candidates with filters
    let query = `
      SELECT 
        c.id,
        c.first_name,
        c.surname,
        c.email,
        c.phone,
        c.status,
        c.email_verified,
        c.profile_completed,
        c.created_at,
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
          'N/A'
        ) as location,
        cp.photo_url as profile_picture,
        COALESCE(JSON_LENGTH(cp.experience), 0) as experience_count
      FROM candidates c
      LEFT JOIN candidate_profiles cp ON c.id = cp.candidate_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status && status !== 'all') {
      query += ' AND c.status = ?';
      params.push(status);
    }

    if (search) {
      query += ' AND (c.first_name LIKE ? OR c.surname LIKE ? OR c.email LIKE ? OR c.phone LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    query += ' ORDER BY c.created_at DESC';

    const candidates = await executeQuery<any>(query, params);

    const formattedCandidates = candidates.map((c: any) => ({
      id: c.id.toString(),
      name: `${c.first_name || ''} ${c.surname || ''}`.trim() || 'N/A',
      email: c.email || '',
      phone: c.phone || '',
      status: c.status || 'pending',
      emailVerified: c.email_verified || false,
      profileCompleted: c.profile_completed || false,
      location: c.location || 'N/A',
      experience: c.experience_count > 0 ? `${c.experience_count} years` : 'N/A',
      profilePicture: c.profile_picture || null,
      createdAt: c.created_at ? new Date(c.created_at).toISOString() : null
    }));

    return NextResponse.json({
      success: true,
      candidates: formattedCandidates
    });

  } catch (error: any) {
    console.error('Get candidates error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch candidates', details: error?.message },
      { status: 500 }
    );
  }
}

