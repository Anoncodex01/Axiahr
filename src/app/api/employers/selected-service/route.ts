import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { verifyToken } from '@/lib/auth';

// GET - Fetch the currently selected service for the authenticated employer
export async function GET(request: NextRequest) {
  try {
    // Get token from cookies or Authorization header
    const token = request.cookies.get('employerAuthToken')?.value || 
                  request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify token
    let decoded: any;
    try {
      decoded = verifyToken(token);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const employerId = decoded.sub || decoded.employerId || decoded.id;
    const employerIdInt = parseInt(String(employerId), 10);

    // Fetch the most recent approved or signed agreement
    const agreements = await executeQuery<any>(
      `SELECT 
        id,
        service_type,
        status,
        created_at,
        approved_at,
        signed_at
      FROM employer_agreements
      WHERE employer_id = ?
      AND status IN ('approved', 'signed')
      ORDER BY 
        CASE 
          WHEN status = 'approved' THEN 1
          WHEN status = 'signed' THEN 2
        END,
        COALESCE(approved_at, signed_at, created_at) DESC
      LIMIT 1`,
      [employerIdInt]
    );

    if (agreements.length === 0) {
      return NextResponse.json({
        success: true,
        hasSelectedService: false,
        selectedService: null
      });
    }

    const agreement = agreements[0];
    
    // Map service_type to display name
    const serviceTypeMap: { [key: string]: string } = {
      'end-to-end': 'Axia End-to-End Recruitment Assistance',
      'free-post': 'Free Jobs Post',
      'premium-post': 'Premium Job Post'
    };

    return NextResponse.json({
      success: true,
      hasSelectedService: true,
      selectedService: {
        id: agreement.id.toString(),
        serviceType: agreement.service_type,
        serviceName: serviceTypeMap[agreement.service_type] || agreement.service_type,
        status: agreement.status,
        selectedAt: agreement.approved_at || agreement.signed_at || agreement.created_at
      }
    });

  } catch (error: any) {
    console.error('Get selected service error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch selected service', details: error?.message },
      { status: 500 }
    );
  }
}

