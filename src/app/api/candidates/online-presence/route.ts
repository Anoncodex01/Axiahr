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

    // Get online presence data for the candidate
    const onlinePresence = await executeQuery(
      'SELECT * FROM candidate_online_presence WHERE candidate_id = ?',
      [candidateId]
    );

    return NextResponse.json({
      success: true,
      data: onlinePresence.length > 0 ? onlinePresence[0] : null
    });

  } catch (error) {
    console.error('Error fetching online presence:', error);
    return NextResponse.json(
      { error: 'Failed to fetch online presence' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { candidateId, onlinePresenceData } = body;

    if (!candidateId || !onlinePresenceData) {
      return NextResponse.json(
        { error: 'Candidate ID and online presence data are required' },
        { status: 400 }
      );
    }

    // Check if online presence already exists
    const existing = await executeQuery(
      'SELECT id FROM candidate_online_presence WHERE candidate_id = ?',
      [candidateId]
    );

    if (existing.length > 0) {
      // Update existing record
      await executeSingleQuery(
        `UPDATE candidate_online_presence SET 
         linkedin_url = ?, github_url = ?, portfolio_url = ?, 
         other_profiles = ?, updated_at = NOW() 
         WHERE candidate_id = ?`,
        [
          onlinePresenceData.linkedin || null,
          onlinePresenceData.github || null,
          onlinePresenceData.portfolio || null,
          onlinePresenceData.otherProfiles ? JSON.stringify(onlinePresenceData.otherProfiles) : null,
          candidateId
        ]
      );

      return NextResponse.json({
        success: true,
        message: 'Online presence updated successfully'
      });
    } else {
      // Insert new record
      const result = await executeSingleQuery(
        `INSERT INTO candidate_online_presence 
         (candidate_id, linkedin_url, github_url, portfolio_url, other_profiles) 
         VALUES (?, ?, ?, ?, ?)`,
        [
          candidateId,
          onlinePresenceData.linkedin || null,
          onlinePresenceData.github || null,
          onlinePresenceData.portfolio || null,
          onlinePresenceData.otherProfiles ? JSON.stringify(onlinePresenceData.otherProfiles) : null
        ]
      );

      return NextResponse.json({
        success: true,
        message: 'Online presence added successfully',
        data: { id: result.insertId }
      });
    }

  } catch (error) {
    console.error('Error saving online presence:', error);
    return NextResponse.json(
      { error: 'Failed to save online presence' },
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

    // Delete online presence
    await executeSingleQuery(
      'DELETE FROM candidate_online_presence WHERE candidate_id = ?',
      [candidateId]
    );

    return NextResponse.json({
      success: true,
      message: 'Online presence deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting online presence:', error);
    return NextResponse.json(
      { error: 'Failed to delete online presence' },
      { status: 500 }
    );
  }
}
