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

    // Get all accomplishments for the candidate
    const accomplishments = await executeQuery(
      'SELECT * FROM candidate_accomplishments WHERE candidate_id = ? ORDER BY year DESC',
      [candidateId]
    );

    return NextResponse.json({
      success: true,
      data: accomplishments
    });

  } catch (error) {
    console.error('Error fetching accomplishments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch accomplishments' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { candidateId, accomplishmentData } = body;

    if (!candidateId || !accomplishmentData) {
      return NextResponse.json(
        { error: 'Candidate ID and accomplishment data are required' },
        { status: 400 }
      );
    }

    // Insert new accomplishment
    const result = await executeSingleQuery(
      `INSERT INTO candidate_accomplishments 
       (candidate_id, type, title, description, year, other_type) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        candidateId,
        accomplishmentData.type,
        accomplishmentData.title,
        accomplishmentData.description || null,
        accomplishmentData.year || null,
        accomplishmentData.otherType || null
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Accomplishment added successfully',
      data: { id: result.insertId }
    });

  } catch (error) {
    console.error('Error adding accomplishment:', error);
    return NextResponse.json(
      { error: 'Failed to add accomplishment' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { accomplishmentId, accomplishmentData } = body;

    if (!accomplishmentId || !accomplishmentData) {
      return NextResponse.json(
        { error: 'Accomplishment ID and accomplishment data are required' },
        { status: 400 }
      );
    }

    // Update existing accomplishment
    await executeSingleQuery(
      `UPDATE candidate_accomplishments SET 
       type = ?, title = ?, description = ?, year = ?, 
       other_type = ?, updated_at = NOW() 
       WHERE id = ?`,
      [
        accomplishmentData.type,
        accomplishmentData.title,
        accomplishmentData.description || null,
        accomplishmentData.year || null,
        accomplishmentData.otherType || null,
        accomplishmentId
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Accomplishment updated successfully'
    });

  } catch (error) {
    console.error('Error updating accomplishment:', error);
    return NextResponse.json(
      { error: 'Failed to update accomplishment' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accomplishmentId = searchParams.get('accomplishmentId');

    if (!accomplishmentId) {
      return NextResponse.json(
        { error: 'Accomplishment ID is required' },
        { status: 400 }
      );
    }

    // Delete accomplishment
    await executeSingleQuery(
      'DELETE FROM candidate_accomplishments WHERE id = ?',
      [accomplishmentId]
    );

    return NextResponse.json({
      success: true,
      message: 'Accomplishment deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting accomplishment:', error);
    return NextResponse.json(
      { error: 'Failed to delete accomplishment' },
      { status: 500 }
    );
  }
}
