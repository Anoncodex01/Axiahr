import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { verifyToken } from '@/lib/auth';

// GET /api/invoices/[id] - Get a single invoice by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const invoiceId = id;

    if (!invoiceId) {
      return NextResponse.json(
        { success: false, error: 'Invoice ID is required' },
        { status: 400 }
      );
    }

    // Get token from cookies or Authorization header
    const token = request.cookies.get('employerAuthToken')?.value || 
                  request.cookies.get('authToken')?.value ||
                  request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify token
    let decoded: any;
    try {
      decoded = verifyToken(token);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const userId = decoded.sub || decoded.employerId || decoded.id;
    const userRole = decoded.role || 'employer';

    // Fetch invoice with related data and check payment status
    const invoiceDetails = await executeQuery(`
      SELECT 
        i.*,
        i.payment_link,
        ol.position_title,
        c.first_name as candidate_first_name,
        c.surname as candidate_last_name,
        j.title as job_title,
        e.company_name,
        e.email as employer_email,
        e.first_name as employer_first_name,
        e.last_name as employer_last_name,
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
      LEFT JOIN offer_letters ol ON i.offer_letter_id = ol.id
      LEFT JOIN candidates c ON i.candidate_id = c.id
      LEFT JOIN jobs j ON i.job_id = j.id
      LEFT JOIN employers e ON i.employer_id = e.id
      WHERE i.id = ?
    `, [invoiceId]);

    if (invoiceDetails.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invoice not found' },
        { status: 404 }
      );
    }

    const invoice = invoiceDetails[0];
    
    // Map effective_status to status for frontend compatibility
    invoice.status = invoice.effective_status || invoice.status;

    // Check if user has permission to view this invoice
    if (userRole !== 'admin') {
      // For employers, check if the invoice belongs to them
      const employerIdToMatch = parseInt(String(userId), 10);
      if (invoice.employer_id !== employerIdToMatch) {
        return NextResponse.json(
          { success: false, error: 'You do not have permission to view this invoice' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      data: invoice
    });

  } catch (error: any) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch invoice' },
      { status: 500 }
    );
  }
}

