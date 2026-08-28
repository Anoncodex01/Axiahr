import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeSingleQuery } from '@/lib/database';
import { verifyToken } from '@/lib/auth';

// GET /api/payments - Get payments
export async function GET(request: NextRequest) {
  try {
    // Get token from cookies or Authorization header
    const token = request.cookies.get('authToken')?.value || 
                  request.cookies.get('employerAuthToken')?.value ||
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

    const userRole = decoded.role || decoded.userType || decoded.type;
    const userId = decoded.sub || decoded.employerId || decoded.id;

    const { searchParams } = new URL(request.url);
    const offerLetterId = searchParams.get('offerLetterId');
    const employerId = searchParams.get('employerId');
    const status = searchParams.get('status');

    let query = `
      SELECT 
        p.*,
        ol.application_id,
        ol.position_title,
        c.first_name as candidate_first_name,
        c.surname as candidate_last_name,
        c.email as candidate_email,
        j.title as job_title,
        e.company_name,
        e.email as employer_email,
        i.id as invoice_id,
        i.invoice_number
      FROM payments p
      LEFT JOIN offer_letters ol ON p.offer_letter_id = ol.id
      LEFT JOIN applications a ON ol.application_id = a.id
      LEFT JOIN candidates c ON a.candidate_id = c.id
      LEFT JOIN jobs j ON a.job_id = j.id
      LEFT JOIN employers e ON p.employer_id = e.id
      LEFT JOIN invoices i ON i.offer_letter_id = ol.id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    
    // If not admin, filter by employer ID
    if (userRole !== 'admin') {
      const employerIdToMatch = userId ? parseInt(String(userId), 10) : null;
      if (employerIdToMatch && !isNaN(employerIdToMatch)) {
        query += ' AND p.employer_id = ?';
        params.push(employerIdToMatch);
      }
    } else if (employerId) {
      // Admin can filter by specific employer
      query += ' AND p.employer_id = ?';
      params.push(parseInt(employerId, 10));
    }
    
    if (offerLetterId) {
      query += ' AND p.offer_letter_id = ?';
      params.push(offerLetterId);
    }
    
    if (status) {
      query += ' AND p.payment_status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY p.created_at DESC';

    const payments = await executeQuery(query, params);

    return NextResponse.json({
      success: true,
      data: payments
    });

  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}

// POST /api/payments - Create payment link
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { offerLetterId, employerId, amount, paymentMethod = 'stripe' } = body;

    // Validate required fields
    if (!offerLetterId || !employerId || !amount) {
      return NextResponse.json(
        { error: 'Offer Letter ID, Employer ID, and Amount are required' },
        { status: 400 }
      );
    }

    // Check if offer letter exists and is accepted
    const offerLetter = await executeQuery(`
      SELECT ol.*, c.first_name, c.last_name, j.title as job_title
      FROM offer_letters ol
      JOIN applications a ON ol.application_id = a.id
      JOIN candidates c ON a.candidate_id = c.id
      JOIN jobs j ON a.job_id = j.id
      WHERE ol.id = ? AND ol.candidate_response = 'accepted'
    `, [offerLetterId]);

    if (offerLetter.length === 0) {
      return NextResponse.json(
        { error: 'Offer letter not found or not accepted' },
        { status: 404 }
      );
    }

    // Create or update payment record
    const existingPayment = await executeQuery(
      'SELECT id FROM payments WHERE offer_letter_id = ?',
      [offerLetterId]
    );

    let paymentId;
    let paymentLink;

    if (existingPayment.length > 0) {
      // Update existing payment
      paymentId = existingPayment[0].id;
      await executeSingleQuery(`
        UPDATE payments 
        SET amount = ?, payment_method = ?, payment_status = 'pending', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [amount, paymentMethod, paymentId]);
    } else {
      // Create new payment
      const result = await executeSingleQuery(`
        INSERT INTO payments (offer_letter_id, employer_id, amount, currency, payment_method, payment_status)
        VALUES (?, ?, ?, 'USD', ?, 'pending')
      `, [offerLetterId, employerId, amount, paymentMethod]);
      paymentId = result.insertId;
    }

    // Generate payment link (in real implementation, integrate with payment gateway)
    paymentLink = `https://payment.axia.com/pay/${paymentId}`;

    // Update payment record with link
    await executeSingleQuery(`
      UPDATE payments 
      SET payment_link = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [paymentLink, paymentId]);

    // Create notification for employer
    const offer = offerLetter[0];
    await executeSingleQuery(`
      INSERT INTO notifications (recipient_id, recipient_type, type, title, message, data)
      VALUES (?, 'employer', 'payment_required', 'Payment Required', ?, ?)
    `, [
      employerId,
      `Payment required for ${offer.first_name} ${offer.last_name} - ${offer.job_title}`,
      JSON.stringify({ 
        paymentId, 
        offerLetterId, 
        amount,
        paymentLink,
        candidateName: `${offer.first_name} ${offer.last_name}`,
        jobTitle: offer.job_title
      })
    ]);

    return NextResponse.json({
      success: true,
      paymentId,
      paymentLink,
      message: 'Payment link generated successfully'
    });

  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 }
    );
  }
}

// PUT /api/payments/[id]/complete - Mark payment as completed
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('id');
    const body = await request.json();
    const { paymentReference, paymentMethod } = body;

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      );
    }

    // Update payment status
    await executeSingleQuery(`
      UPDATE payments 
      SET payment_status = 'completed', payment_reference = ?, payment_method = ?, 
          payment_date = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [paymentReference, paymentMethod, paymentId]);

    // Get payment details for invoice generation
    const paymentDetails = await executeQuery(`
      SELECT p.*, ol.application_id, c.first_name, c.last_name, j.title as job_title, e.company_name
      FROM payments p
      JOIN offer_letters ol ON p.offer_letter_id = ol.id
      JOIN applications a ON ol.application_id = a.id
      JOIN candidates c ON a.candidate_id = c.id
      JOIN jobs j ON a.job_id = j.id
      JOIN employers e ON j.employer_id = e.id
      WHERE p.id = ?
    `, [paymentId]);

    if (paymentDetails.length > 0) {
      const payment = paymentDetails[0];

      // Generate invoice
      const invoiceNumber = `INV-${Date.now()}`;
      const invoiceFileUrl = `/invoices/${invoiceNumber}.pdf`; // In real implementation, generate actual PDF

      const invoiceResult = await executeSingleQuery(`
        INSERT INTO invoices (payment_id, employer_id, invoice_number, invoice_file_url, amount, currency, status)
        VALUES (?, ?, ?, ?, ?, 'USD', 'generated')
      `, [paymentId, payment.employer_id, invoiceNumber, invoiceFileUrl, payment.amount]);

      const invoiceId = invoiceResult.insertId;

      // Create notifications
      await executeSingleQuery(`
        INSERT INTO notifications (recipient_id, recipient_type, type, title, message, data)
        VALUES (?, 'employer', 'invoice_generated', 'Invoice Generated', ?, ?)
      `, [
        payment.employer_id,
        `Invoice ${invoiceNumber} has been generated for ${payment.first_name} ${payment.last_name}`,
        JSON.stringify({ 
          invoiceId, 
          invoiceNumber, 
          invoiceFileUrl,
          amount: payment.amount,
          candidateName: `${payment.first_name} ${payment.last_name}`,
          jobTitle: payment.job_title
        })
      ]);

      await executeSingleQuery(`
        INSERT INTO notifications (recipient_id, recipient_type, type, title, message, data)
        VALUES (?, 'admin', 'invoice_generated', 'Invoice Generated', ?, ?)
      `, [
        1, // Assuming admin user ID is 1
        `Invoice ${invoiceNumber} has been generated for ${payment.company_name}`,
        JSON.stringify({ 
          invoiceId, 
          invoiceNumber, 
          invoiceFileUrl,
          amount: payment.amount,
          employerName: payment.company_name,
          candidateName: `${payment.first_name} ${payment.last_name}`
        })
      ]);
    }

    return NextResponse.json({
      success: true,
      message: 'Payment completed and invoice generated successfully'
    });

  } catch (error) {
    console.error('Error completing payment:', error);
    return NextResponse.json(
      { error: 'Failed to complete payment' },
      { status: 500 }
    );
  }
}
