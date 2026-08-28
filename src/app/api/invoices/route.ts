import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { verifyToken } from '@/lib/auth';

// GET /api/invoices - Get invoices for employer or admin
export async function GET(request: NextRequest) {
  try {
    // Get token from cookies or Authorization header
    const token = request.cookies.get('employerAuthToken')?.value || 
                  request.cookies.get('authToken')?.value ||
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

    const { searchParams } = new URL(request.url);
    const employerId = searchParams.get('employerId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '100');

    // Check if user is admin or employer
    const userRole = decoded.role || decoded.userType || decoded.type;
    const userId = decoded.sub || decoded.employerId || decoded.id;
    
    console.log('📋 Fetching invoices:', {
      userRole,
      userId,
      decodedSub: decoded.sub,
      decodedType: decoded.type,
      employerId: searchParams.get('employerId'),
      status: searchParams.get('status'),
      fullDecoded: JSON.stringify(decoded)
    });

    let query = `
      SELECT 
        i.*,
        i.payment_link,
        ol.position_title,
        c.first_name as candidate_first_name,
        c.surname as candidate_last_name,
        j.title as job_title,
        e.company_name,
        e.email as employer_email,
        -- Check if payment exists and is completed
        CASE 
          WHEN EXISTS (
            SELECT 1 FROM payments p 
            WHERE p.offer_letter_id = i.offer_letter_id 
            AND p.payment_status = 'completed'
          ) THEN 'paid'
          ELSE i.status
        END as effective_status
      FROM invoices i
      JOIN offer_letters ol ON i.offer_letter_id = ol.id
      JOIN candidates c ON i.candidate_id = c.id
      JOIN jobs j ON i.job_id = j.id
      JOIN employers e ON i.employer_id = e.id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    
    // If not admin, filter by employer ID
    if (userRole !== 'admin') {
      // Convert userId to integer for database comparison (database stores as INT)
      const employerIdToMatch = userId ? parseInt(String(userId), 10) : null;
      console.log('📋 Filtering by employer ID:', { userId, employerIdToMatch, userRole });
      if (employerIdToMatch && !isNaN(employerIdToMatch)) {
        query += ' AND i.employer_id = ?';
        params.push(employerIdToMatch);
      } else {
        console.warn('⚠️ Invalid employer ID, cannot filter invoices');
      }
    } else if (employerId) {
      // Admin can filter by specific employer
      query += ' AND i.employer_id = ?';
      params.push(parseInt(employerId, 10));
    }
    
    if (status) {
      query += ' AND i.status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY i.created_at DESC LIMIT ?';
    params.push(limit);

    const invoices = await executeQuery(query, params);
    
    // Map effective_status to status for frontend compatibility
    const mappedInvoices = invoices.map((inv: any) => ({
      ...inv,
      status: inv.effective_status || inv.status
    }));
    
    console.log('📋 Invoices fetched:', {
      count: mappedInvoices.length,
      invoiceIds: mappedInvoices.map((inv: any) => inv.id),
      employerIds: mappedInvoices.map((inv: any) => inv.employer_id),
      statuses: mappedInvoices.map((inv: any) => ({ id: inv.id, status: inv.status }))
    });

    return NextResponse.json({
      success: true,
      data: mappedInvoices,
      count: mappedInvoices.length
    });

  } catch (error: any) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch invoices' },
      { status: 500 }
    );
  }
}
