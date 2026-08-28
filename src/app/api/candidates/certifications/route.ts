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

    // Get all certifications for the candidate
    const certifications = await executeQuery(
      'SELECT * FROM candidate_certifications WHERE candidate_id = ? ORDER BY year_of_completion DESC',
      [candidateId]
    );

    return NextResponse.json({
      success: true,
      data: certifications
    });

  } catch (error) {
    console.error('Error fetching certifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch certifications' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { candidateId, certificationData } = body;

    if (!candidateId || !certificationData) {
      return NextResponse.json(
        { error: 'Candidate ID and certification data are required' },
        { status: 400 }
      );
    }

    // Insert new certification
    const result = await executeSingleQuery(
      `INSERT INTO candidate_certifications 
       (candidate_id, name, issuing_body, year_of_completion, validity) 
       VALUES (?, ?, ?, ?, ?)`,
      [
        candidateId,
        certificationData.name,
        certificationData.issuingBody || null,
        certificationData.yearOfCompletion || null,
        certificationData.validity || null
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Certification added successfully',
      data: { id: result.insertId }
    });

  } catch (error) {
    console.error('Error adding certification:', error);
    return NextResponse.json(
      { error: 'Failed to add certification' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { certificationId, certificationData } = body;

    if (!certificationId || !certificationData) {
      return NextResponse.json(
        { error: 'Certification ID and certification data are required' },
        { status: 400 }
      );
    }

    // Update existing certification
    await executeSingleQuery(
      `UPDATE candidate_certifications SET 
       name = ?, issuing_body = ?, year_of_completion = ?, 
       validity = ?, updated_at = NOW() 
       WHERE id = ?`,
      [
        certificationData.name,
        certificationData.issuingBody || null,
        certificationData.yearOfCompletion || null,
        certificationData.validity || null,
        certificationId
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Certification updated successfully'
    });

  } catch (error) {
    console.error('Error updating certification:', error);
    return NextResponse.json(
      { error: 'Failed to update certification' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const certificationId = searchParams.get('certificationId');

    if (!certificationId) {
      return NextResponse.json(
        { error: 'Certification ID is required' },
        { status: 400 }
      );
    }

    // Delete certification
    await executeSingleQuery(
      'DELETE FROM candidate_certifications WHERE id = ?',
      [certificationId]
    );

    return NextResponse.json({
      success: true,
      message: 'Certification deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting certification:', error);
    return NextResponse.json(
      { error: 'Failed to delete certification' },
      { status: 500 }
    );
  }
}
