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

    // Get job preferences for the candidate
    const preferences = await executeQuery(
      'SELECT * FROM candidate_job_preferences WHERE candidate_id = ?',
      [candidateId]
    );

    return NextResponse.json({
      success: true,
      data: preferences.length > 0 ? preferences[0] : null
    });

  } catch (error) {
    console.error('Error fetching job preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job preferences' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { candidateId, preferencesData } = body;

    console.log('📥 Job Preferences API - Received data:', {
      candidateId,
      preferencesData,
      hasJobType: !!preferencesData?.jobType,
      hasWorkMode: !!preferencesData?.workMode,
      hasShiftTiming: !!preferencesData?.shiftTiming,
      relocationPreference: preferencesData?.relocationPreference,
      noticePeriod: preferencesData?.noticePeriod,
      industries: preferencesData?.industries,
      roles: preferencesData?.roles
    });

    if (!candidateId || !preferencesData) {
      console.error('❌ Job Preferences API - Missing required fields:', { candidateId, preferencesData });
      return NextResponse.json(
        { error: 'Candidate ID and preferences data are required' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!preferencesData.jobType || !preferencesData.workMode || !preferencesData.shiftTiming) {
      console.error('❌ Job Preferences API - Missing required fields:', {
        jobType: preferencesData.jobType,
        workMode: preferencesData.workMode,
        shiftTiming: preferencesData.shiftTiming
      });
      return NextResponse.json(
        { error: 'Job Type, Work Mode, and Shift Timing are required' },
        { status: 400 }
      );
    }

    // MySQL runs in non-strict mode, so a value outside the column's allowed list is
    // silently stored as '' instead of failing. Reject unknown values up front.
    const ALLOWED_JOB_TYPES = ['full-time', 'part-time', 'on-site', 'remote', 'hybrid', 'contract', 'freelance', 'fixed-term', 'permanent', 'internship'];
    const ALLOWED_WORK_MODES = ['on-site', 'remote', 'hybrid', 'office'];
    const ALLOWED_SHIFTS = ['day', 'night', 'flexible'];
    if (
      !ALLOWED_JOB_TYPES.includes(preferencesData.jobType) ||
      !ALLOWED_WORK_MODES.includes(preferencesData.workMode) ||
      !ALLOWED_SHIFTS.includes(preferencesData.shiftTiming)
    ) {
      return NextResponse.json(
        { error: 'Invalid Job Type, Work Mode, or Shift Timing' },
        { status: 400 }
      );
    }

    // Check if preferences already exist
    const existing = await executeQuery(
      'SELECT id FROM candidate_job_preferences WHERE candidate_id = ?',
      [candidateId]
    );

    console.log('🔍 Job Preferences API - Existing check:', { candidateId, exists: existing.length > 0 });

    // Prepare data for database
    const relocationPref = preferencesData.relocationPreference || (preferencesData.travelFlexibility ? 'yes' : 'no');
    const industriesJson = preferencesData.industries && Array.isArray(preferencesData.industries) 
      ? JSON.stringify(preferencesData.industries) 
      : null;
    const rolesJson = preferencesData.roles && Array.isArray(preferencesData.roles) 
      ? JSON.stringify(preferencesData.roles) 
      : null;

    console.log('💾 Job Preferences API - Prepared data:', {
      jobType: preferencesData.jobType,
      workMode: preferencesData.workMode,
      shiftTiming: preferencesData.shiftTiming,
      relocationPreference: relocationPref,
      noticePeriod: preferencesData.noticePeriod,
      industriesJson,
      rolesJson
    });

    if (existing.length > 0) {
      // Update existing preferences
      console.log('🔄 Job Preferences API - Updating existing preferences for candidate:', candidateId);
      await executeSingleQuery(
        `UPDATE candidate_job_preferences SET 
         job_type = ?, work_mode = ?, shift_timing = ?, relocation_preference = ?, 
         notice_period = ?, preferred_industries = ?, preferred_roles = ?, updated_at = NOW() 
         WHERE candidate_id = ?`,
        [
          preferencesData.jobType,
          preferencesData.workMode,
          preferencesData.shiftTiming,
          relocationPref,
          preferencesData.noticePeriod || null,
          industriesJson,
          rolesJson,
          candidateId
        ]
      );

      console.log('✅ Job Preferences API - Updated successfully');
      return NextResponse.json({
        success: true,
        message: 'Job preferences updated successfully'
      });
    } else {
      // Insert new preferences
      console.log('➕ Job Preferences API - Inserting new preferences for candidate:', candidateId);
      const result = await executeSingleQuery(
        `INSERT INTO candidate_job_preferences 
         (candidate_id, job_type, work_mode, shift_timing, relocation_preference, notice_period, preferred_industries, preferred_roles, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          candidateId,
          preferencesData.jobType,
          preferencesData.workMode,
          preferencesData.shiftTiming,
          relocationPref,
          preferencesData.noticePeriod || null,
          industriesJson,
          rolesJson
        ]
      );

      console.log('✅ Job Preferences API - Inserted successfully:', { insertId: result.insertId });
      return NextResponse.json({
        success: true,
        message: 'Job preferences added successfully',
        data: { id: result.insertId }
      });
    }

  } catch (error: any) {
    console.error('❌ Job Preferences API - Error saving job preferences:', error);
    console.error('Error details:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name
    });
    return NextResponse.json(
      { 
        error: 'Failed to save job preferences',
        details: error?.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const candidateId = searchParams.get('candidateId');

    if (!candidateId) {
      return NextResponse.json(
        { error: 'Candidate ID is required' },
        { status: 400 }
      );
    }

    // Delete job preferences
    await executeSingleQuery(
      'DELETE FROM candidate_job_preferences WHERE candidate_id = ?',
      [candidateId]
    );

    return NextResponse.json({
      success: true,
      message: 'Job preferences deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting job preferences:', error);
    return NextResponse.json(
      { error: 'Failed to delete job preferences' },
      { status: 500 }
    );
  }
}
