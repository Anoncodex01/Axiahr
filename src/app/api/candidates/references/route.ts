import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeSingleQuery } from '@/lib/database';
import { REFERENCES_ENABLED } from '@/utils/profileCompletion';

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

    // Get all references for the candidate
    const references = await executeQuery(
      'SELECT * FROM candidate_references WHERE candidate_id = ? ORDER BY created_at DESC',
      [candidateId]
    );

    return NextResponse.json({
      success: true,
      data: references
    });

  } catch (error) {
    console.error('Error fetching references:', error);
    return NextResponse.json(
      { error: 'Failed to fetch references' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { candidateId, referenceData } = body;

    if (!candidateId || !referenceData) {
      return NextResponse.json(
        { error: 'Candidate ID and reference data are required' },
        { status: 400 }
      );
    }

    // Insert new reference
    const result = await executeSingleQuery(
      `INSERT INTO candidate_references 
       (candidate_id, name, designation, company, email, phone, relationship, verification_status, 
        created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', NOW(), NOW())`,
      [
        candidateId,
        referenceData.fullName || referenceData.full_name,
        referenceData.designation,
        referenceData.organization,
        referenceData.email,
        referenceData.phone || '',
        referenceData.relationship
      ]
    );

    // Referee verification email is disabled for now, see REFERENCES_ENABLED
    if (REFERENCES_ENABLED && referenceData.consentToContact) {
      try {
        const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/referee-verification?ref=${result.insertId}&candidate=Candidate`;
        
        const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/send-referee-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            refereeEmail: referenceData.email,
            candidateName: 'Candidate',
            referenceName: referenceData.fullName,
            verificationLink: verificationLink
          }),
        });

        if (emailResponse.ok) {
          console.log('Referee verification email sent successfully');
        } else {
          console.error('Failed to send referee verification email');
        }
      } catch (emailError) {
        console.error('Error sending referee verification email:', emailError);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Reference added successfully',
      data: { id: result.insertId }
    });

  } catch (error) {
    console.error('Error adding reference:', error);
    return NextResponse.json(
      { error: 'Failed to add reference' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { referenceId, referenceData } = body;

    if (!referenceId || !referenceData) {
      return NextResponse.json(
        { error: 'Reference ID and reference data are required' },
        { status: 400 }
      );
    }

    // Update existing reference
    await executeSingleQuery(
      `UPDATE candidate_references SET 
       name = ?, 
       designation = ?, 
       company = ?, 
       email = ?, 
       phone = ?, 
       relationship = ?, 
       updated_at = NOW() 
       WHERE id = ?`,
      [
        referenceData.fullName || referenceData.full_name,
        referenceData.designation,
        referenceData.organization,
        referenceData.email,
        referenceData.phone || '',
        referenceData.relationship,
        referenceId
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Reference updated successfully'
    });

  } catch (error) {
    console.error('Error updating reference:', error);
    return NextResponse.json(
      { error: 'Failed to update reference' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const referenceId = searchParams.get('referenceId');

    if (!referenceId) {
      return NextResponse.json(
        { error: 'Reference ID is required' },
        { status: 400 }
      );
    }

    // Delete reference
    await executeSingleQuery(
      'DELETE FROM candidate_references WHERE id = ?',
      [referenceId]
    );

    return NextResponse.json({
      success: true,
      message: 'Reference deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting reference:', error);
    return NextResponse.json(
      { error: 'Failed to delete reference' },
      { status: 500 }
    );
  }
}
