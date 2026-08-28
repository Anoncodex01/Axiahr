import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { verifyToken } from '@/lib/auth';

// GET - Fetch offer letters for authenticated candidate
export async function GET(request: NextRequest) {
  try {
    // Get token from cookies or Authorization header (check both token names)
    const token = request.cookies.get('authToken')?.value || 
                  request.cookies.get('candidateAuthToken')?.value ||
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

    const candidateId = decoded.sub;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    // Build query to get offer letters for this candidate
    let query = `
      SELECT 
        ol.id,
        ol.application_id,
        ol.offer_file_url,
        ol.offer_amount,
        ol.start_date,
        ol.position_title,
        ol.status,
        ol.candidate_response,
        ol.rejection_reason,
        ol.response_date,
        ol.expiry_date,
        ol.created_at,
        ol.updated_at,
        j.title as job_title,
        j.location as job_location,
        j.employment_type
      FROM offer_letters ol
      INNER JOIN applications a ON ol.application_id = a.id
      INNER JOIN jobs j ON a.job_id = j.id
      WHERE a.candidate_id = ?
    `;
    
    const params: any[] = [candidateId];
    
    if (status && status !== 'all') {
      query += ' AND ol.status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY ol.created_at DESC';

    const offerLetters = await executeQuery<any>(query, params);

    // Format offer letters
    const formattedOffers = offerLetters.map((offer: any) => ({
      id: offer.id.toString(),
      applicationId: offer.application_id.toString(),
      jobTitle: offer.job_title,
      jobLocation: offer.job_location,
      employmentType: offer.employment_type,
      offerFileUrl: offer.offer_file_url,
      offerAmount: offer.offer_amount ? parseFloat(offer.offer_amount).toLocaleString() : null,
      startDate: offer.start_date ? new Date(offer.start_date).toISOString() : null,
      positionTitle: offer.position_title,
      status: offer.status,
      candidateResponse: offer.candidate_response,
      rejectionReason: offer.rejection_reason,
      responseDate: offer.response_date ? new Date(offer.response_date).toISOString() : null,
      expiryDate: offer.expiry_date ? new Date(offer.expiry_date).toISOString() : null,
      createdAt: offer.created_at ? new Date(offer.created_at).toISOString() : null,
      updatedAt: offer.updated_at ? new Date(offer.updated_at).toISOString() : null
    }));

    return NextResponse.json({
      success: true,
      offerLetters: formattedOffers
    });

  } catch (error: any) {
    console.error('Get candidate offer letters error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch offer letters', details: error?.message },
      { status: 500 }
    );
  }
}

