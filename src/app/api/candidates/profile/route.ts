import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { executeQuery, executeSingleQuery, executeBatchQueries } from '@/lib/database';

function parseMaybeDeep(value: any) {
  if (value == null) return null;
  if (typeof value !== 'string') return value;
  try {
    const once = JSON.parse(value);
    if (typeof once === 'string') {
      try { return JSON.parse(once); } catch { return once; }
    }
    return once;
  } catch {
    return value;
  }
}

function normalizeForStorage(value: any) {
  const v = parseMaybeDeep(value);
  if (v == null) return null;
  try { return JSON.stringify(v); } catch { return null; }
}

function normalizeRelocation(value: any): 'yes' | 'no' {
  if (typeof value === 'string') {
    const v = value.trim().toLowerCase();
    if (v === 'yes' || v === 'no') return v as 'yes' | 'no';
    if (v === '1' || v === 'true') return 'yes';
    if (v === '0' || v === 'false') return 'no';
    return v ? 'yes' : 'no';
  }
  if (typeof value === 'number') return value ? 'yes' : 'no';
  if (typeof value === 'boolean') return value ? 'yes' : 'no';
  return 'no';
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let candidateId = searchParams.get('candidateId');
    if (!candidateId || candidateId === 'null' || candidateId === 'undefined') {
      // Try Authorization: Bearer <token>
      const authHeader = request.headers.get('authorization');
      let token: string | null = null;
      if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
        token = authHeader.substring(7).trim();
      }
      // Try HttpOnly cookie
      if (!token) {
        const jar = request.cookies;
        token = jar.get('axia_candidate_token')?.value || jar.get('authToken')?.value || jar.get('auth_token')?.value || jar.get('token')?.value || null;
      }
      if (token) {
        try {
          const payload: any = verifyToken(token);
          if (payload?.candidateId || payload?.id || payload?.sub) {
            candidateId = String(payload.candidateId ?? payload.id ?? payload.sub);
          }
        } catch { /* ignore invalid token */ }
      }
    }

    // Get candidateId from token first (most reliable)
    const authHeader = request.headers.get('authorization');
    let token: string | null = null;
    if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
      token = authHeader.substring(7).trim();
    }
    if (!token) {
      const jar = request.cookies;
      token = jar.get('axia_candidate_token')?.value || jar.get('authToken')?.value || jar.get('auth_token')?.value || jar.get('token')?.value || null;
    }
    
    let tokenCandidateId: string | null = null;
    if (token) {
      try {
        const payload: any = verifyToken(token);
        tokenCandidateId = String((payload.candidateId ?? payload.id ?? payload.sub) || '');
      } catch (e) {
        console.warn('Failed to verify token:', e);
      }
    }
    
    // If candidateId is provided but doesn't match token, use token candidateId
    if (candidateId && tokenCandidateId && candidateId !== tokenCandidateId) {
      console.warn(`⚠️ CandidateId mismatch: request has ${candidateId} but token has ${tokenCandidateId}. Using token candidateId.`);
      candidateId = tokenCandidateId;
    }
    
    // If no candidateId provided, use token candidateId
    if ((!candidateId || candidateId === 'null' || candidateId === 'undefined') && tokenCandidateId) {
      candidateId = tokenCandidateId;
    }

    if (!candidateId || candidateId === 'null' || candidateId === 'undefined') {
      return NextResponse.json(
        { error: 'Candidate ID is required. Please login again.' },
        { status: 401 }
      );
    }
    
    // Validate that the candidateId matches the token (security check)
    if (tokenCandidateId && candidateId !== tokenCandidateId) {
      return NextResponse.json(
        { error: 'Access denied. Candidate ID mismatch. Please login again.' },
        { status: 403 }
      );
    }

    // Get candidate basic info
    let candidates = await executeQuery(
      'SELECT id, first_name, middle_name, surname, email, phone, alternate_phone, whatsapp_phone, gender, email_verified, status FROM candidates WHERE id = ?',
      [candidateId]
    );

    // If candidate not found, return 404
    if (candidates.length === 0) {
      console.error(`❌ Candidate ${candidateId} not found in database`);
      return NextResponse.json(
        { 
          success: false,
          error: 'Candidate not found',
          message: 'The candidate profile does not exist. Please log out and log in again, or contact support if the issue persists.'
        },
        { status: 404 }
      );
    }

    const candidate = candidates[0];

    // Execute all queries using a single connection to avoid pool exhaustion
    const [
      profiles,
      experiences,
      education,
      languages,
      salary,
      references,
      projects,
      accomplishments,
      certifications,
      onlinePresence,
      skills,
      jobPreferences,
      resume,
      preferredLocations
    ] = await executeBatchQueries([
      { query: 'SELECT *, is_open_for_relocation FROM candidate_profiles WHERE candidate_id = ?', params: [candidateId] },
      { query: 'SELECT * FROM candidate_experience WHERE candidate_id = ? ORDER BY start_date DESC', params: [candidateId] },
      { query: 'SELECT * FROM candidate_education WHERE candidate_id = ? ORDER BY start_date DESC', params: [candidateId] },
      { query: 'SELECT * FROM candidate_languages WHERE candidate_id = ? ORDER BY created_at DESC', params: [candidateId] },
      { query: 'SELECT * FROM candidate_salary WHERE candidate_id = ?', params: [candidateId] },
      { query: 'SELECT * FROM candidate_references WHERE candidate_id = ? ORDER BY created_at DESC', params: [candidateId] },
      { query: 'SELECT * FROM candidate_projects WHERE candidate_id = ? ORDER BY start_date DESC', params: [candidateId] },
      { query: 'SELECT * FROM candidate_accomplishments WHERE candidate_id = ? ORDER BY year DESC', params: [candidateId] },
      { query: 'SELECT * FROM candidate_certifications WHERE candidate_id = ? ORDER BY year_of_completion DESC', params: [candidateId] },
      { query: 'SELECT * FROM candidate_online_presence WHERE candidate_id = ?', params: [candidateId] },
      { query: 'SELECT * FROM candidate_skills WHERE candidate_id = ? ORDER BY created_at DESC', params: [candidateId] },
      { query: 'SELECT * FROM candidate_job_preferences WHERE candidate_id = ?', params: [candidateId] },
      { query: 'SELECT * FROM candidate_resume WHERE candidate_id = ?', params: [candidateId] },
      { query: 'SELECT location_string FROM candidate_preferred_locations WHERE candidate_id = ? ORDER BY display_order ASC', params: [candidateId] }
    ]);

    // Transform the data to match the frontend format
    const profileData = {
      candidate: {
        id: candidate.id,
        firstName: candidate.first_name,
        middleName: candidate.middle_name,
        surname: candidate.surname,
        email: candidate.email,
        phone: candidate.phone,
        alternatePhone: candidate.alternate_phone,
        whatsapp: candidate.whatsapp_phone,
        gender: candidate.gender,
        emailVerified: candidate.email_verified,
        status: candidate.status
      },
      profile: profiles.length > 0 ? {
        ...profiles[0],
        current_location: profiles[0].current_location_city || profiles[0].current_location_state || profiles[0].current_location_country ? {
          city: profiles[0].current_location_city || '',
          state: profiles[0].current_location_state || '',
          country: profiles[0].current_location_country || ''
        } : null,
        permanent_location: profiles[0].permanent_location_city || profiles[0].permanent_location_state || profiles[0].permanent_location_country ? {
          city: profiles[0].permanent_location_city || '',
          state: profiles[0].permanent_location_state || '',
          country: profiles[0].permanent_location_country || ''
        } : null,
        current_address: profiles[0].current_address_house_no || profiles[0].current_address_street_name || profiles[0].current_address_landmark ? {
          houseNo: profiles[0].current_address_house_no || '',
          streetName: profiles[0].current_address_street_name || '',
          landmark: profiles[0].current_address_landmark || '',
          postalCode: profiles[0].current_address_postal_code || ''
        } : null,
        permanent_address: profiles[0].permanent_address_house_no || profiles[0].permanent_address_street_name || profiles[0].permanent_address_landmark ? {
          houseNo: profiles[0].permanent_address_house_no || '',
          streetName: profiles[0].permanent_address_street_name || '',
          landmark: profiles[0].permanent_address_landmark || '',
          postalCode: profiles[0].permanent_address_postal_code || ''
        } : null,
        preferred_locations: preferredLocations.map((loc: any) => loc.location_string || ''),
        preferredLocations: preferredLocations.map((loc: any) => loc.location_string || ''),
        resume_headline: profiles[0].resume_headline || null,
        profile_summary: profiles[0].profile_summary || null,
        experience_type: profiles[0].experience_type || 'fresher',
        total_experience_years: profiles[0].total_experience_years || null,
        total_experience_months: profiles[0].total_experience_months || null,
        is_open_for_relocation: (() => {
          const pref = (() => { const v = parseMaybeDeep(profiles[0].preferred_locations); return Array.isArray(v) ? v : []; })();
          const raw = profiles[0].is_open_for_relocation;
          const normalized = raw == null ? (pref.length > 0 ? 'yes' : 'no') : normalizeRelocation(raw);
          return normalized;
        })(),
        isOpenForRelocation: (() => {
          const pref = (() => { const v = parseMaybeDeep(profiles[0].preferred_locations); return Array.isArray(v) ? v : []; })();
          const raw = profiles[0].is_open_for_relocation;
          const normalized = raw == null ? (pref.length > 0 ? 'yes' : 'no') : normalizeRelocation(raw);
          return normalized;
        })()
      } : null,
      experience: experiences,
      education: education,
      languages: languages,
      salary: salary.length > 0 ? salary[0] : null,
      references: references,
      projects: projects,
      accomplishments: accomplishments,
      certifications: certifications,
      onlinePresence: onlinePresence.length > 0 ? {
        linkedin: onlinePresence[0].linkedin_url,
        github: onlinePresence[0].github_url,
        portfolio: onlinePresence[0].portfolio_url,
        otherProfiles: onlinePresence[0].other_profiles ? JSON.parse(onlinePresence[0].other_profiles) : []
      } : {
        linkedin: '',
        github: '',
        portfolio: '',
        otherProfiles: []
      },
      skills: skills,
      jobPreferences: jobPreferences.length > 0 ? {
        jobType: jobPreferences[0].job_type,
        workMode: jobPreferences[0].work_mode,
        shiftTiming: jobPreferences[0].shift_timing,
        travelFlexibility: jobPreferences[0].relocation_preference === 'yes',
        noticePeriod: jobPreferences[0].notice_period,
        industries: jobPreferences[0].preferred_industries ? JSON.parse(jobPreferences[0].preferred_industries) : [],
        roles: jobPreferences[0].preferred_roles ? JSON.parse(jobPreferences[0].preferred_roles) : []
      } : {
        jobType: 'permanent',
        workMode: 'hybrid',
        shiftTiming: 'day',
        travelFlexibility: false,
        noticePeriod: '',
        industries: [],
        roles: []
      },
      resume: resume.length > 0 ? {
        resumeUrl: resume[0].resume_url,
        resumeFilename: resume[0].resume_filename,
        resumeSize: resume[0].resume_size
      } : null
    };

    return NextResponse.json({
      success: true,
      data: profileData,
      candidateId: candidate.id // Return the actual candidateId used (in case of mismatch correction)
    });

  } catch (error) {
    console.error('Error fetching candidate profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch candidate profile' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    let { candidateId, candidateData, profileData } = body;
    if (!candidateId || candidateId === 'null' || candidateId === 'undefined') {
      const authHeader = request.headers.get('authorization');
      let token: string | null = null;
      if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
        token = authHeader.substring(7).trim();
      }
      if (!token) {
        const jar = request.cookies;
        token = jar.get('axia_candidate_token')?.value || jar.get('authToken')?.value || jar.get('auth_token')?.value || jar.get('token')?.value || null;
      }
      if (token) {
        try {
          const payload: any = verifyToken(token);
          if (payload?.candidateId || payload?.id || payload?.sub) {
            candidateId = String(payload.candidateId ?? payload.id ?? payload.sub);
          }
        } catch { /* ignore invalid token */ }
      }
    }

    if (!candidateId) {
      return NextResponse.json(
        { error: 'Candidate ID is required' },
        { status: 400 }
      );
    }

    // Optional: update candidate basic record if provided
    if (candidateData && Object.keys(candidateData).length > 0) {
      // Check if email is being updated
      let emailChanged = false;
      let oldEmail = '';
      let newEmail = '';
      
      if (candidateData.email) {
        // Get current email from database
        const currentCandidate = await executeQuery(
          'SELECT email FROM candidates WHERE id = ?',
          [candidateId]
        );
        
        if (currentCandidate.length > 0) {
          oldEmail = currentCandidate[0].email?.toLowerCase().trim() || '';
          newEmail = candidateData.email.toLowerCase().trim();
          emailChanged = oldEmail !== newEmail;
        }
      }
      
      // Normalize gender to 'Male'|'Female'|'Other'
      let cg = candidateData.gender;
      if (typeof cg === 'string') {
        const g = cg.toLowerCase();
        cg = g === 'male' ? 'Male' : g === 'female' ? 'Female' : 'Other';
      }
      
      // Build update query
      const updateFields = [];
      const updateValues = [];
      
      if (candidateData.first_name !== undefined) {
        updateFields.push('first_name = COALESCE(?, first_name)');
        updateValues.push(candidateData.first_name ?? null);
      }
      if (candidateData.middle_name !== undefined) {
        updateFields.push('middle_name = COALESCE(?, middle_name)');
        updateValues.push(candidateData.middle_name ?? null);
      }
      if (candidateData.surname !== undefined) {
        updateFields.push('surname = COALESCE(?, surname)');
        updateValues.push(candidateData.surname ?? null);
      }
      if (candidateData.phone !== undefined) {
        updateFields.push('phone = COALESCE(?, phone)');
        updateValues.push(candidateData.phone ?? null);
      }
      if (candidateData.alternatePhone !== undefined) {
        updateFields.push('alternate_phone = COALESCE(?, alternate_phone)');
        updateValues.push(candidateData.alternatePhone ?? null);
      }
      if (candidateData.whatsapp !== undefined) {
        updateFields.push('whatsapp_phone = COALESCE(?, whatsapp_phone)');
        updateValues.push(candidateData.whatsapp ?? null);
      }
      if (cg !== undefined) {
        updateFields.push('gender = COALESCE(?, gender)');
        updateValues.push(cg ?? null);
      }
      if (emailChanged && newEmail) {
        updateFields.push('email = ?');
        updateFields.push('email_verified = FALSE'); // Mark as unverified when email changes
        updateValues.push(newEmail);
      }
      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      updateValues.push(candidateId);
      
      if (updateFields.length > 1) { // More than just updated_at
        await executeSingleQuery(
          `UPDATE candidates SET ${updateFields.join(', ')} WHERE id = ?`,
          updateValues
        );
      }
      
      // If email changed, send verification email
      if (emailChanged && newEmail) {
        try {
          const { sendEmail } = await import('@/lib/email');
          const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
          const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

          // Store new OTP in database
          await executeSingleQuery(
            `INSERT INTO candidate_email_verifications (candidate_id, email, otp_code, expires_at) 
             VALUES (?, ?, ?, ?)`,
            [candidateId, newEmail, otpCode, expiresAt]
          );

          // Send verification email
          await sendEmail({
            to: newEmail,
            subject: 'Verify Your New Email - Axia HR Advisory',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                  <h1 style="color: #114373; margin: 0;">Axia HR Advisory</h1>
                  <p style="color: #666; margin: 10px 0 0 0;">Professional HR Solutions</p>
                </div>
                
                <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center;">
                  <h2 style="color: #114373; margin: 0 0 20px 0;">Verify Your New Email Address</h2>
                  <p style="color: #666; margin: 0 0 20px 0;">
                    You have updated your email address. Please use the verification code below to verify your new email:
                  </p>
                  
                  <div style="background: #114373; color: white; font-size: 32px; font-weight: bold; padding: 20px; border-radius: 8px; letter-spacing: 5px; margin: 20px 0;">
                    ${otpCode}
                  </div>
                  
                  <p style="color: #666; margin: 20px 0 0 0; font-size: 14px;">
                    This code will expire in 5 minutes. If you didn't request this change, please contact support immediately.
                  </p>
                </div>
                
                <div style="text-align: center; margin-top: 30px; color: #666; font-size: 14px;">
                  <p>Best regards,<br>The Axia HR Advisory Team</p>
                </div>
              </div>
            `
          });
        } catch (emailError) {
          console.error('Failed to send verification email:', emailError);
          // Don't fail the entire update if email sending fails
        }
      }
    }

    // Check if profile exists
    const existingProfile = await executeQuery(
      'SELECT id FROM candidate_profiles WHERE candidate_id = ?',
      [candidateId]
    );

    if (existingProfile.length > 0) {
      // Update existing profile
      // Build dynamic update query to avoid collation issues
      const updateFields = [];
      const updateValues = [];
      
      if (profileData?.date_of_birth || profileData?.dateOfBirth) {
        updateFields.push('date_of_birth = ?');
        updateValues.push(profileData?.date_of_birth ?? profileData?.dateOfBirth);
      }
      
      if (profileData?.gender) {
        updateFields.push('gender = ?');
        updateValues.push(profileData.gender.toString().toLowerCase());
      }
      
      if (profileData?.nationality) {
        updateFields.push('nationality = ?');
        updateValues.push(profileData.nationality);
      }
      
      if (profileData?.origin) {
        updateFields.push('origin = ?');
        updateValues.push(profileData.origin);
      }
      
      if (profileData?.marital_status || profileData?.maritalStatus) {
        updateFields.push('marital_status = ?');
        updateValues.push(profileData?.marital_status ?? profileData?.maritalStatus);
      }
      
      // Update current location (new columns)
      if (profileData?.current_location || profileData?.currentLocation) {
        const currentLoc = profileData?.current_location ?? profileData?.currentLocation;
        if (currentLoc && typeof currentLoc === 'object') {
          updateFields.push('current_location_city = ?');
          updateFields.push('current_location_state = ?');
          updateFields.push('current_location_country = ?');
          updateValues.push(currentLoc.city || null);
          updateValues.push(currentLoc.state || null);
          updateValues.push(currentLoc.country || null);
        }
      }
      
      // Update permanent location (new columns)
      if (profileData?.permanent_location || profileData?.permanentLocation) {
        const permanentLoc = profileData?.permanent_location ?? profileData?.permanentLocation;
        if (permanentLoc && typeof permanentLoc === 'object') {
          updateFields.push('permanent_location_city = ?');
          updateFields.push('permanent_location_state = ?');
          updateFields.push('permanent_location_country = ?');
          updateValues.push(permanentLoc.city || null);
          updateValues.push(permanentLoc.state || null);
          updateValues.push(permanentLoc.country || null);
        }
      }
      
      // Update current address (new columns)
      if (profileData?.current_address || profileData?.currentAddress) {
        const currentAddr = profileData?.current_address ?? profileData?.currentAddress;
        if (currentAddr && typeof currentAddr === 'object') {
          updateFields.push('current_address_house_no = ?');
          updateFields.push('current_address_street_name = ?');
          updateFields.push('current_address_landmark = ?');
          updateFields.push('current_address_postal_code = ?');
          updateValues.push(currentAddr.houseNo || null);
          updateValues.push(currentAddr.streetName || null);
          updateValues.push(currentAddr.landmark || null);
          updateValues.push(currentAddr.postalCode || null);
        }
      }
      
      // Update permanent address (new columns)
      if (profileData?.permanent_address || profileData?.permanentAddress) {
        const permanentAddr = profileData?.permanent_address ?? profileData?.permanentAddress;
        if (permanentAddr && typeof permanentAddr === 'object') {
          updateFields.push('permanent_address_house_no = ?');
          updateFields.push('permanent_address_street_name = ?');
          updateFields.push('permanent_address_landmark = ?');
          updateFields.push('permanent_address_postal_code = ?');
          updateValues.push(permanentAddr.houseNo || null);
          updateValues.push(permanentAddr.streetName || null);
          updateValues.push(permanentAddr.landmark || null);
          updateValues.push(permanentAddr.postalCode || null);
        }
      }
      
      // Update preferred locations (new table)
      if (profileData?.preferredLocations && Array.isArray(profileData.preferredLocations)) {
        // Delete existing preferred locations
        await executeSingleQuery(
          'DELETE FROM candidate_preferred_locations WHERE candidate_id = ?',
          [candidateId]
        );
        
        // Insert new preferred locations
        if (profileData.preferredLocations.length > 0) {
          const insertValues = profileData.preferredLocations.map((loc: string, index: number) => {
            // Parse location string to extract city, state, country
            // Can be: "Country", "State, Country", or "City, State, Country"
            const parts = loc.split(',').map(p => p.trim()).filter(Boolean);
            
            let city = null;
            let state = null;
            let country = null;
            
            if (parts.length === 1) {
              // Just country: "Country"
              country = parts[0];
            } else if (parts.length === 2) {
              // State and Country: "State, Country"
              state = parts[0];
              country = parts[1];
            } else if (parts.length >= 3) {
              // City, State, Country: "City, State, Country"
              city = parts[0];
              state = parts[1];
              country = parts[parts.length - 1]; // Last part is always country
            }
            
            return [candidateId, loc, city, state, country, index];
          });
          
          const placeholders = insertValues.map(() => '(?, ?, ?, ?, ?, ?)').join(', ');
          const flatValues = insertValues.flat();
          
          await executeSingleQuery(
            `INSERT INTO candidate_preferred_locations 
             (candidate_id, location_string, city, state, country, display_order) 
             VALUES ${placeholders}`,
            flatValues
          );
        }
      }
      
      if (profileData?.resume_headline) {
        updateFields.push('resume_headline = ?');
        updateValues.push(profileData.resume_headline);
      }
      
      if (profileData?.profile_summary) {
        updateFields.push('profile_summary = ?');
        updateValues.push(profileData.profile_summary);
      }
      
      if (profileData?.experience_type) {
        updateFields.push('experience_type = ?');
        updateValues.push(profileData.experience_type);
      }

      if (profileData?.status) {
        updateFields.push('status = ?');
        updateValues.push(profileData.status);
      }
      
      if (profileData?.total_experience_years !== undefined) {
        updateFields.push('total_experience_years = ?');
        updateValues.push(profileData.total_experience_years);
      }
      
      if (profileData?.total_experience_months !== undefined) {
        updateFields.push('total_experience_months = ?');
        updateValues.push(profileData.total_experience_months);
      }
      
      if (updateFields.length > 0) {
        updateFields.push('updated_at = CURRENT_TIMESTAMP');
        updateValues.push(candidateId);
        
        await executeSingleQuery(
          `UPDATE candidate_profiles SET ${updateFields.join(', ')} WHERE candidate_id = ?`,
          updateValues
        );
      }
    } else {
      // Create new profile
      const currentLoc = profileData?.current_location ?? profileData?.currentLocation;
      const permanentLoc = profileData?.permanent_location ?? profileData?.permanentLocation;
      const currentAddr = profileData?.current_address ?? profileData?.currentAddress;
      const permanentAddr = profileData?.permanent_address ?? profileData?.permanentAddress;
      
      await executeSingleQuery(
        `INSERT INTO candidate_profiles 
         (candidate_id, date_of_birth, gender, nationality, origin, marital_status, 
          current_location_city, current_location_state, current_location_country,
          permanent_location_city, permanent_location_state, permanent_location_country,
          current_address_house_no, current_address_street_name, current_address_landmark, current_address_postal_code,
          permanent_address_house_no, permanent_address_street_name, permanent_address_landmark, permanent_address_postal_code,
          resume_headline, profile_summary, experience_type, total_experience_years, total_experience_months) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          candidateId,
          (profileData?.date_of_birth ?? profileData?.dateOfBirth) || null,
          (profileData?.gender ?? '').toString().toLowerCase() || null,
          (profileData?.nationality ?? null),
          (profileData?.origin ?? null),
          (profileData?.marital_status ?? profileData?.maritalStatus) || null,
          (currentLoc && typeof currentLoc === 'object') ? (currentLoc.city || null) : null,
          (currentLoc && typeof currentLoc === 'object') ? (currentLoc.state || null) : null,
          (currentLoc && typeof currentLoc === 'object') ? (currentLoc.country || null) : null,
          (permanentLoc && typeof permanentLoc === 'object') ? (permanentLoc.city || null) : null,
          (permanentLoc && typeof permanentLoc === 'object') ? (permanentLoc.state || null) : null,
          (permanentLoc && typeof permanentLoc === 'object') ? (permanentLoc.country || null) : null,
          (currentAddr && typeof currentAddr === 'object') ? (currentAddr.houseNo || null) : null,
          (currentAddr && typeof currentAddr === 'object') ? (currentAddr.streetName || null) : null,
          (currentAddr && typeof currentAddr === 'object') ? (currentAddr.landmark || null) : null,
          (currentAddr && typeof currentAddr === 'object') ? (currentAddr.postalCode || null) : null,
          (permanentAddr && typeof permanentAddr === 'object') ? (permanentAddr.houseNo || null) : null,
          (permanentAddr && typeof permanentAddr === 'object') ? (permanentAddr.streetName || null) : null,
          (permanentAddr && typeof permanentAddr === 'object') ? (permanentAddr.landmark || null) : null,
          (permanentAddr && typeof permanentAddr === 'object') ? (permanentAddr.postalCode || null) : null,
          profileData?.resume_headline || null,
          profileData?.profile_summary || null,
          profileData?.experience_type || 'fresher',
          profileData?.total_experience_years || null,
          profileData?.total_experience_months || null
        ]
      );
      
      // Insert preferred locations into separate table
      if (profileData?.preferredLocations && Array.isArray(profileData.preferredLocations) && profileData.preferredLocations.length > 0) {
        const insertValues = profileData.preferredLocations.map((loc: string, index: number) => {
          // Parse location string to extract city, state, country
          // Can be: "Country", "State, Country", or "City, State, Country"
          const parts = loc.split(',').map(p => p.trim()).filter(Boolean);
          
          let city = null;
          let state = null;
          let country = null;
          
          if (parts.length === 1) {
            // Just country: "Country"
            country = parts[0];
          } else if (parts.length === 2) {
            // State and Country: "State, Country"
            state = parts[0];
            country = parts[1];
          } else if (parts.length >= 3) {
            // City, State, Country: "City, State, Country"
            city = parts[0];
            state = parts[1];
            country = parts[parts.length - 1]; // Last part is always country
          }
          
          return [candidateId, loc, city, state, country, index];
        });
        
        const placeholders = insertValues.map(() => '(?, ?, ?, ?, ?, ?)').join(', ');
        const flatValues = insertValues.flat();
        
        await executeSingleQuery(
          `INSERT INTO candidate_preferred_locations 
           (candidate_id, location_string, city, state, country, display_order) 
           VALUES ${placeholders}`,
          flatValues
        );
      }
    }

    // Handle job preferences update
    if (profileData?.jobPreferences) {
      const jobPrefs = profileData.jobPreferences;
      
      // Check if job preferences exist
      const existingJobPrefs = await executeQuery(
        'SELECT id FROM candidate_job_preferences WHERE candidate_id = ?',
        [candidateId]
      );

      if (existingJobPrefs.length > 0) {
        // Update existing job preferences
        await executeSingleQuery(
          `UPDATE candidate_job_preferences SET 
            job_type = ?, 
            work_mode = ?, 
            shift_timing = ?, 
            relocation_preference = ?, 
            notice_period = ?, 
            preferred_industries = ?, 
            preferred_roles = ?,
            updated_at = CURRENT_TIMESTAMP
            WHERE candidate_id = ?`,
          [
            jobPrefs.jobType || 'permanent',
            jobPrefs.workMode || 'hybrid',
            jobPrefs.shiftTiming || 'day',
            jobPrefs.travelFlexibility ? 'yes' : 'no',
            jobPrefs.noticePeriod || '',
            JSON.stringify(jobPrefs.industries || []),
            JSON.stringify(jobPrefs.roles || []),
            candidateId
          ]
        );
      } else {
        // Create new job preferences
        await executeSingleQuery(
          `INSERT INTO candidate_job_preferences 
           (candidate_id, job_type, work_mode, shift_timing, relocation_preference, notice_period, preferred_industries, preferred_roles) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            candidateId,
            jobPrefs.jobType || 'permanent',
            jobPrefs.workMode || 'hybrid',
            jobPrefs.shiftTiming || 'day',
            jobPrefs.travelFlexibility ? 'yes' : 'no',
            jobPrefs.noticePeriod || '',
            JSON.stringify(jobPrefs.industries || []),
            JSON.stringify(jobPrefs.roles || [])
          ]
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Error updating candidate profile:', error);
    return NextResponse.json(
      { error: 'Failed to update candidate profile' },
      { status: 500 }
    );
  }
}