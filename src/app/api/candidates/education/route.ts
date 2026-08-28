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

    // Get education data
    const education = await executeQuery(
      'SELECT * FROM candidate_education WHERE candidate_id = ? ORDER BY start_date DESC',
      [candidateId]
    );

    return NextResponse.json({
      success: true,
      data: education
    });

  } catch (error) {
    console.error('Error fetching education data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch education data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { candidateId, educationData } = body;

    if (!candidateId || !educationData) {
      return NextResponse.json(
        { error: 'Candidate ID and education data are required' },
        { status: 400 }
      );
    }

    // Insert new education
    // field_of_study is now nullable, so allow empty values
    const fieldOfStudy = (educationData.specialization || educationData.field_of_study || '').trim() || null;
    
    // Validate required fields
    if (!educationData.institute && !educationData.institution) {
      return NextResponse.json(
        { error: 'Institution is required' },
        { status: 400 }
      );
    }
    
    if (!educationData.degree && !educationData.qualification) {
      return NextResponse.json(
        { error: 'Qualification/Degree is required' },
        { status: 400 }
      );
    }
    
    if (!educationData.startDate && !educationData.start_date) {
      return NextResponse.json(
        { error: 'Start date is required' },
        { status: 400 }
      );
    }

    const result = await executeSingleQuery(
      `INSERT INTO candidate_education 
       (candidate_id, country, category, institution, qualification, field_of_study, start_date, end_date, gpa_achievement, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        candidateId,
        educationData.country || null,
        educationData.category || null,
        educationData.institute || educationData.institution,
        educationData.degree || educationData.qualification,
        fieldOfStudy,
        educationData.startDate || educationData.start_date,
        educationData.endDate || educationData.end_date || null,
        educationData.description || null
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Education added successfully',
      data: { id: result.insertId }
    });

  } catch (error) {
    console.error('Error adding education:', error);
    return NextResponse.json(
      { error: 'Failed to add education' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { educationId, educationData } = body;

    if (!educationId || !educationData) {
      return NextResponse.json(
        { error: 'Education ID and education data are required' },
        { status: 400 }
      );
    }

    // Update existing education
    // field_of_study is now nullable, so allow empty values
    const fieldOfStudy = (educationData.specialization || educationData.field_of_study || '').trim() || null;
    
    // Validate required fields
    if (!educationData.institute && !educationData.institution) {
      return NextResponse.json(
        { error: 'Institution is required' },
        { status: 400 }
      );
    }
    
    if (!educationData.degree && !educationData.qualification) {
      return NextResponse.json(
        { error: 'Qualification/Degree is required' },
        { status: 400 }
      );
    }
    
    if (!educationData.startDate && !educationData.start_date) {
      return NextResponse.json(
        { error: 'Start date is required' },
        { status: 400 }
      );
    }

    await executeSingleQuery(
      `UPDATE candidate_education SET 
       country = ?, category = ?, institution = ?, qualification = ?, field_of_study = ?, 
       start_date = ?, end_date = ?, gpa_achievement = ?, updated_at = NOW() 
       WHERE id = ?`,
      [
        educationData.country || null,
        educationData.category || null,
        educationData.institute || educationData.institution,
        educationData.degree || educationData.qualification,
        fieldOfStudy,
        educationData.startDate || educationData.start_date,
        educationData.endDate || educationData.end_date || null,
        educationData.description || null,
        educationId
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Education updated successfully'
    });

  } catch (error) {
    console.error('Error updating education:', error);
    return NextResponse.json(
      { error: 'Failed to update education' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const educationId = searchParams.get('educationId');

    if (!educationId) {
      return NextResponse.json(
        { error: 'Education ID is required' },
        { status: 400 }
      );
    }

    // Delete education
    await executeSingleQuery(
      'DELETE FROM candidate_education WHERE id = ?',
      [educationId]
    );

    return NextResponse.json({
      success: true,
      message: 'Education deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting education:', error);
    return NextResponse.json(
      { error: 'Failed to delete education' },
      { status: 500 }
    );
  }
}
