import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeSingleQuery } from '@/lib/database';

// GET /api/withholding-tax - Get withholding tax documents
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const invoiceId = searchParams.get('invoiceId');
    const employerId = searchParams.get('employerId');
    const status = searchParams.get('status');

    let query = `
      SELECT 
        wtd.*,
        i.invoice_number,
        i.amount,
        e.company_name,
        c.first_name,
        c.last_name,
        j.title as job_title
      FROM withholding_tax_documents wtd
      LEFT JOIN invoices i ON wtd.invoice_id = i.id
      LEFT JOIN employers e ON wtd.employer_id = e.id
      LEFT JOIN payments p ON i.payment_id = p.id
      LEFT JOIN offer_letters ol ON p.offer_letter_id = ol.id
      LEFT JOIN applications a ON ol.application_id = a.id
      LEFT JOIN candidates c ON a.candidate_id = c.id
      LEFT JOIN jobs j ON a.job_id = j.id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    
    if (invoiceId) {
      query += ' AND wtd.invoice_id = ?';
      params.push(invoiceId);
    }
    
    if (employerId) {
      query += ' AND wtd.employer_id = ?';
      params.push(employerId);
    }
    
    if (status) {
      query += ' AND wtd.status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY wtd.uploaded_date DESC';

    const documents = await executeQuery(query, params);

    return NextResponse.json({
      success: true,
      data: documents
    });

  } catch (error) {
    console.error('Error fetching withholding tax documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch withholding tax documents' },
      { status: 500 }
    );
  }
}

// POST /api/withholding-tax - Upload withholding tax document
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { invoiceId, employerId, documentFileUrl, documentType = 'withholding_tax' } = body;

    // Validate required fields
    if (!invoiceId || !employerId || !documentFileUrl) {
      return NextResponse.json(
        { error: 'Invoice ID, Employer ID, and Document File URL are required' },
        { status: 400 }
      );
    }

    // Validate document type
    if (!['withholding_tax', 'tax_certificate', 'other'].includes(documentType)) {
      return NextResponse.json(
        { error: 'Invalid document type' },
        { status: 400 }
      );
    }

    // Check if invoice exists
    const invoice = await executeQuery(
      'SELECT id FROM invoices WHERE id = ?',
      [invoiceId]
    );

    if (invoice.length === 0) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // Create withholding tax document record
    const result = await executeSingleQuery(`
      INSERT INTO withholding_tax_documents (
        invoice_id, employer_id, document_file_url, document_type, status
      ) VALUES (?, ?, ?, ?, 'uploaded')
    `, [invoiceId, employerId, documentFileUrl, documentType]);

    const documentId = result.insertId;

    // Get invoice details for notifications
    const invoiceDetails = await executeQuery(`
      SELECT i.*, e.company_name, c.first_name, c.last_name, j.title as job_title
      FROM invoices i
      JOIN employers e ON i.employer_id = e.id
      JOIN payments p ON i.payment_id = p.id
      JOIN offer_letters ol ON p.offer_letter_id = ol.id
      JOIN applications a ON ol.application_id = a.id
      JOIN candidates c ON a.candidate_id = c.id
      JOIN jobs j ON a.job_id = j.id
      WHERE i.id = ?
    `, [invoiceId]);

    if (invoiceDetails.length > 0) {
      const invoice = invoiceDetails[0];

      // Create notification for admin
      await executeSingleQuery(`
        INSERT INTO notifications (recipient_id, recipient_type, type, title, message, data)
        VALUES (?, 'admin', 'document_uploaded', 'Withholding Tax Document Uploaded', ?, ?)
      `, [
        1, // Assuming admin user ID is 1
        `Withholding tax document uploaded for ${invoice.company_name} - ${invoice.first_name} ${invoice.last_name}`,
        JSON.stringify({ 
          documentId, 
          invoiceId,
          invoiceNumber: invoice.invoice_number,
          employerName: invoice.company_name,
          candidateName: `${invoice.first_name} ${invoice.last_name}`,
          jobTitle: invoice.job_title,
          documentType
        })
      ]);

      // Update invoice status to paid
      await executeSingleQuery(`
        UPDATE invoices 
        SET status = 'paid', paid_date = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [invoiceId]);

      // Mark job as closed if all positions are filled
      const jobDetails = await executeQuery(`
        SELECT j.id, j.max_hires, j.current_hires, j.status
        FROM jobs j
        JOIN applications a ON j.id = a.job_id
        JOIN offer_letters ol ON a.id = ol.application_id
        JOIN invoices i ON ol.id = (
          SELECT p.offer_letter_id FROM payments p WHERE p.id = (
            SELECT payment_id FROM invoices WHERE id = ?
          )
        )
        WHERE i.id = ?
      `, [invoiceId, invoiceId]);

      if (jobDetails.length > 0) {
        const job = jobDetails[0];
        const newHireCount = job.current_hires + 1;
        
        if (newHireCount >= job.max_hires) {
          await executeSingleQuery(`
            UPDATE jobs 
            SET current_hires = ?, status = 'closed', updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `, [newHireCount, job.id]);
        } else {
          await executeSingleQuery(`
            UPDATE jobs 
            SET current_hires = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `, [newHireCount, job.id]);
        }
      }
    }

    return NextResponse.json({
      success: true,
      documentId,
      message: 'Withholding tax document uploaded successfully'
    });

  } catch (error) {
    console.error('Error uploading withholding tax document:', error);
    return NextResponse.json(
      { error: 'Failed to upload withholding tax document' },
      { status: 500 }
    );
  }
}

// PUT /api/withholding-tax/[id]/verify - Verify withholding tax document
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('id');
    const body = await request.json();
    const { status, verificationNotes } = body;

    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }

    // Validate status
    if (!['verified', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be verified or rejected' },
        { status: 400 }
      );
    }

    // Update document status
    await executeSingleQuery(`
      UPDATE withholding_tax_documents 
      SET status = ?, verification_notes = ?, verified_date = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [status, verificationNotes, documentId]);

    return NextResponse.json({
      success: true,
      message: `Document ${status} successfully`
    });

  } catch (error) {
    console.error('Error verifying withholding tax document:', error);
    return NextResponse.json(
      { error: 'Failed to verify withholding tax document' },
      { status: 500 }
    );
  }
}
