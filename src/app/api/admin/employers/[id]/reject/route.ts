import { NextRequest, NextResponse } from 'next/server';
import { executeSingleQuery } from '@/lib/database';

// PUT - Reject employer profile
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { reason } = await request.json();
    const { id: employerId } = await params;

    if (!employerId) {
      return NextResponse.json(
        { error: 'Employer ID is required' },
        { status: 400 }
      );
    }

    // Update profile status to rejected
    await executeSingleQuery(
      `UPDATE employers 
       SET profile_status = 'rejected', 
           updated_at = NOW()
       WHERE id = ?`,
      [employerId]
    );

    return NextResponse.json({
      success: true,
      message: 'Employer profile rejected successfully',
      reason: reason || ''
    });

  } catch (error: any) {
    console.error('Reject employer error:', error);
    return NextResponse.json(
      { error: 'Failed to reject employer', details: error?.message },
      { status: 500 }
    );
  }
}

