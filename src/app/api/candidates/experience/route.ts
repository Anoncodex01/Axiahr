import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeSingleQuery } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const candidateId = searchParams.get('candidateId');

    if (!candidateId) {
      return NextResponse.json(
        { error: 'Candidate ID is required' },
        { status: 400 }
      );
    }

    // Get experience data
    const experiences = await executeQuery(
      'SELECT * FROM candidate_experience WHERE candidate_id = ? ORDER BY start_date DESC',
      [candidateId]
    );

    return NextResponse.json({
      success: true,
      data: experiences
    });

  } catch (error) {
    console.error('Error fetching experience data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch experience data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { candidateId, experienceData } = body;

    console.log('📥 Received experience data:', JSON.stringify(experienceData, null, 2));

    if (!candidateId || !experienceData) {
      return NextResponse.json(
        { error: 'Candidate ID and experience data are required' },
        { status: 400 }
      );
    }

    // Insert new experience
    // Use designation for job_title if jobTitle is not provided (since we removed jobTitle field from UI)
    const jobTitle = experienceData.jobTitle || experienceData.job_title || experienceData.designation || '';
    
    // Validate required fields
    const companyName = experienceData.companyName || experienceData.company_name || '';
    if (!companyName || companyName.trim() === '') {
      console.error('❌ Missing companyName. Received data:', experienceData);
      return NextResponse.json(
        { error: 'Company name is required.' },
        { status: 400 }
      );
    }
    
    if (!jobTitle || jobTitle.trim() === '') {
      console.error('❌ Missing designation/jobTitle. Received data:', experienceData);
      return NextResponse.json(
        { error: 'Designation/Job title is required.' },
        { status: 400 }
      );
    }
    
    // Validate required fields - check both startDate and start_date
    const startDate = experienceData.startDate || experienceData.start_date || experienceData.fromDate;
    if (!startDate || startDate.trim() === '') {
      console.error('❌ Missing startDate. Received data:', experienceData);
      return NextResponse.json(
        { error: 'Start date is required. Please provide startDate or start_date field.' },
        { status: 400 }
      );
    }
    
    const result = await executeSingleQuery(
      `INSERT INTO candidate_experience 
       (candidate_id, company_name, job_title, designation, start_date, end_date, is_current, 
        industry, level, description, roles_responsibilities, achievements, experience_type) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        candidateId,
        companyName,
        jobTitle,
        experienceData.designation || jobTitle,
        startDate,
        experienceData.endDate || experienceData.end_date || null,
        experienceData.isCurrent || experienceData.is_current || false,
        experienceData.industry || null,
        experienceData.level || null,
        experienceData.companyProfile || experienceData.company_profile || experienceData.description || null,
        experienceData.rolesResponsibilities || experienceData.roles_responsibilities || '',
        experienceData.keyAchievements || experienceData.key_achievements || experienceData.achievements || null,
        experienceData.experienceType || experienceData.experience_type || 'work'
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Experience added successfully',
      data: { id: result.insertId }
    });

  } catch (error) {
    console.error('Error adding experience:', error);
    return NextResponse.json(
      { error: 'Failed to add experience' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { experienceId, experienceData } = body;

    if (!experienceId || !experienceData) {
      return NextResponse.json(
        { error: 'Experience ID and experience data are required' },
        { status: 400 }
      );
    }

    // Update existing experience
    // Use designation for job_title if jobTitle is not provided (since we removed jobTitle field from UI)
    const jobTitle = experienceData.jobTitle || experienceData.job_title || experienceData.designation || '';
    
    // Validate required fields
    const companyName = experienceData.companyName || experienceData.company_name || '';
    if (!companyName || companyName.trim() === '') {
      console.error('❌ Missing companyName. Received data:', experienceData);
      return NextResponse.json(
        { error: 'Company name is required.' },
        { status: 400 }
      );
    }
    
    if (!jobTitle || jobTitle.trim() === '') {
      console.error('❌ Missing designation/jobTitle. Received data:', experienceData);
      return NextResponse.json(
        { error: 'Designation/Job title is required.' },
        { status: 400 }
      );
    }
    
    const startDate = experienceData.startDate || experienceData.start_date;
    if (!startDate || startDate.trim() === '') {
      return NextResponse.json(
        { error: 'Start date is required' },
        { status: 400 }
      );
    }
    
    await executeSingleQuery(
      `UPDATE candidate_experience SET 
       company_name = ?, job_title = ?, designation = ?, start_date = ?, end_date = ?, 
       is_current = ?, industry = ?, level = ?, description = ?, roles_responsibilities = ?, achievements = ?, 
       experience_type = ?, updated_at = NOW() 
       WHERE id = ?`,
      [
        companyName,
        jobTitle,
        experienceData.designation || jobTitle,
        startDate,
        experienceData.endDate || experienceData.end_date || null,
        experienceData.isCurrent || experienceData.is_current || false,
        experienceData.industry || null,
        experienceData.level || null,
        experienceData.companyProfile || experienceData.company_profile || experienceData.description || null,
        experienceData.rolesResponsibilities || experienceData.roles_responsibilities || '',
        experienceData.keyAchievements || experienceData.key_achievements || experienceData.achievements || null,
        experienceData.experienceType || experienceData.experience_type || 'work',
        experienceId
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Experience updated successfully'
    });

  } catch (error) {
    console.error('Error updating experience:', error);
    return NextResponse.json(
      { error: 'Failed to update experience' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const experienceId = searchParams.get('experienceId');

    if (!experienceId) {
      return NextResponse.json(
        { error: 'Experience ID is required' },
        { status: 400 }
      );
    }

    // Delete experience
    await executeSingleQuery(
      'DELETE FROM candidate_experience WHERE id = ?',
      [experienceId]
    );

    return NextResponse.json({
      success: true,
      message: 'Experience deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting experience:', error);
    return NextResponse.json(
      { error: 'Failed to delete experience' },
      { status: 500 }
    );
  }
}
