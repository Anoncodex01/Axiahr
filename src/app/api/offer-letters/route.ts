import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeSingleQuery } from '@/lib/database';
import { sendEmail } from '@/lib/email';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { verifyToken } from '@/lib/auth';

// GET /api/offer-letters - Get offer letters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get('applicationId');
    const employerId = searchParams.get('employerId');
    const status = searchParams.get('status');

    let query = `
      SELECT 
        ol.*,
        a.candidate_id,
        c.first_name,
        c.surname as last_name,
        c.email as candidate_email,
        j.title as job_title,
        e.company_name
      FROM offer_letters ol
      LEFT JOIN applications a ON ol.application_id = a.id
      LEFT JOIN candidates c ON a.candidate_id = c.id
      LEFT JOIN jobs j ON a.job_id = j.id
      LEFT JOIN employers e ON j.employer_id = e.id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    
    if (applicationId) {
      query += ' AND ol.application_id = ?';
      params.push(applicationId);
    }
    
    if (employerId) {
      query += ' AND ol.employer_id = ?';
      params.push(employerId);
    }
    
    if (status) {
      query += ' AND ol.status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY ol.created_at DESC';

    const offerLetters = await executeQuery(query, params);

    return NextResponse.json({
      success: true,
      data: offerLetters
    });

  } catch (error) {
    console.error('Error fetching offer letters:', error);
    return NextResponse.json(
      { error: 'Failed to fetch offer letters' },
      { status: 500 }
    );
  }
}

// POST /api/offer-letters - Upload offer letter
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      applicationId,
      employerId,
      offerFileUrl,
      offerAmount,
      startDate,
      positionTitle,
      expiryDate
    } = body;

    // Validate required fields
    if (!applicationId || !employerId || !offerFileUrl) {
      return NextResponse.json(
        { 
          error: 'Application ID, Employer ID, and Offer File URL are required',
          details: `Received: applicationId=${applicationId}, employerId=${employerId}, offerFileUrl=${offerFileUrl ? 'present' : 'missing'}`
        },
        { status: 400 }
      );
    }

    // Check if application is selected
    const application = await executeQuery(
      'SELECT status FROM applications WHERE id = ?',
      [applicationId]
    );

    if (application.length === 0) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    if (application[0].status !== 'selected') {
      return NextResponse.json(
        { error: 'Application must be selected before uploading offer letter' },
        { status: 400 }
      );
    }

    // Parse offer amount - remove currency symbols, commas, and convert to number
    let parsedOfferAmount: number | null = null;
    if (offerAmount) {
      // Remove currency symbols, commas, spaces, and convert to number
      const cleanedAmount = offerAmount.toString()
        .replace(/[$,€£¥₹,\s]/g, '')
        .trim();
      parsedOfferAmount = parseFloat(cleanedAmount) || null;
    }

    // Check if an offer letter already exists for this application
    const existingOffers = await executeQuery(`
      SELECT id, status, candidate_response, created_at
      FROM offer_letters 
      WHERE application_id = ? AND employer_id = ?
      ORDER BY created_at DESC
    `, [applicationId, employerId]);

    // If there's an existing offer that's not rejected or expired, prevent creating a new one
    if (existingOffers.length > 0) {
      // Check for any active offer
      // Block if: status is 'sent' (pending), 'accepted', or any status that's not 'rejected' or 'expired'
      const activeOffer = existingOffers.find((offer: any) => {
        const isRejected = offer.status === 'rejected' || offer.candidate_response === 'rejected';
        const isExpired = offer.status === 'expired';
        const isAccepted = offer.status === 'accepted' || offer.candidate_response === 'accepted';
        const isPending = offer.status === 'sent' && !offer.candidate_response;
        
        // Block if: pending (sent with no response), accepted, or any other active status
        // Only allow if: rejected or expired
        return !isRejected && !isExpired;
      });
      
      if (activeOffer) {
        const statusMessage = activeOffer.candidate_response === 'accepted' 
          ? 'The candidate has already accepted an offer for this position.'
          : activeOffer.status === 'sent'
          ? 'An offer letter has already been sent to this candidate and is pending their response. You cannot send another offer letter until the candidate responds. If the candidate has not responded, please contact Axia Admin for assistance.'
          : 'An active offer letter already exists for this candidate.';
        
        console.log(`🚫 Duplicate offer prevented - Active offer found:`, {
          existingOfferId: activeOffer.id,
          status: activeOffer.status,
          candidateResponse: activeOffer.candidate_response,
          applicationId,
          employerId
        });
        
        return NextResponse.json(
          { 
            success: false,
            error: statusMessage,
            existingOfferId: activeOffer.id,
            existingOfferStatus: activeOffer.status,
            existingOfferResponse: activeOffer.candidate_response,
            message: 'You cannot send an offer letter twice. If the candidate has not responded, please contact Axia Admin for assistance.'
          },
          { status: 400 }
        );
      }
    }

    // Create offer letter
    try {
      const result = await executeSingleQuery(`
        INSERT INTO offer_letters (
          application_id, employer_id, offer_file_url, offer_amount,
          start_date, position_title, expiry_date, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'sent')
      `, [
        applicationId, employerId, offerFileUrl, parsedOfferAmount,
        startDate || null, positionTitle || null, expiryDate || null
      ]);

      const offerLetterId = result.insertId;

      // Create notification for candidate
      const candidateInfo = await executeQuery(`
        SELECT c.id, c.first_name, c.surname as last_name, c.email, j.title as job_title
        FROM candidates c
        JOIN applications a ON c.id = a.candidate_id
        JOIN jobs j ON a.job_id = j.id
        WHERE a.id = ?
      `, [applicationId]);

      if (candidateInfo.length > 0) {
        const candidate = candidateInfo[0];
        
        // Create notification
        await executeSingleQuery(`
          INSERT INTO notifications (recipient_id, recipient_type, type, title, message, data)
          VALUES (?, 'candidate', 'offer_sent', 'Offer Letter Received', ?, ?)
        `, [
          candidate.id,
          `Congratulations! You have received an offer letter for ${candidate.job_title}`,
          JSON.stringify({ 
            offerLetterId, 
            applicationId, 
            jobTitle: candidate.job_title,
            offerAmount,
            expiryDate
          })
        ]);

        // Send email with offer letter attachment
        try {
          // Read the offer letter file
          const filePath = join(process.cwd(), 'public', offerFileUrl);
          let fileBuffer: Buffer | undefined;
          let fileName = 'offer-letter.pdf';
          
          try {
            fileBuffer = await readFile(filePath);
            // Extract filename from URL
            const urlParts = offerFileUrl.split('/');
            fileName = urlParts[urlParts.length - 1] || 'offer-letter.pdf';
          } catch (fileError) {
            console.error('Error reading offer letter file:', fileError);
            // Continue without attachment if file read fails
          }

          // Format offer amount in TZS
          const formattedAmount = parsedOfferAmount 
            ? (() => {
                const formatted = new Intl.NumberFormat('en-TZ', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0
                }).format(parsedOfferAmount);
                return `TZS ${formatted}`;
              })()
            : offerAmount || 'Not specified';

          // Format dates
          const startDateFormatted = startDate 
            ? new Date(startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
            : 'To be discussed';
          const expiryDateFormatted = expiryDate 
            ? new Date(expiryDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
            : 'Not specified';

          // Send email with attachment
          const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #114373 0%, #0d3559 100%); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
                <h1 style="margin: 0; font-size: 24px; font-weight: 600;">Axia HR Advisory</h1>
                <p style="margin: 5px 0 0 0; font-size: 16px; opacity: 0.9;">Offer Letter Received</p>
              </div>
              
              <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 12px 12px;">
                <h2 style="color: #114373; margin-top: 0; font-size: 20px;">Congratulations, ${candidate.first_name}!</h2>
              
                <p style="color: #1e293b; font-size: 16px; line-height: 1.6;">
                  We are pleased to inform you that you have received an offer letter for the position of <strong>${positionTitle || candidate.job_title}</strong>.
                </p>
                
                <div style="background: white; border-left: 4px solid #114373; padding: 20px; margin: 25px 0; border-radius: 8px;">
                  <h3 style="color: #114373; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">📋 Offer Details</h3>
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 8px 0; color: #64748b; font-weight: 600; width: 140px;">Position:</td>
                      <td style="padding: 8px 0; color: #1e293b; font-size: 15px;"><strong>${positionTitle || candidate.job_title}</strong></td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Offer Amount:</td>
                      <td style="padding: 8px 0; color: #1e293b; font-size: 15px;"><strong>${formattedAmount}</strong></td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Start Date:</td>
                      <td style="padding: 8px 0; color: #1e293b; font-size: 15px;"><strong>${startDateFormatted}</strong></td>
                    </tr>
                    ${expiryDate ? `
                    <tr>
                      <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Response Deadline:</td>
                      <td style="padding: 8px 0; color: #1e293b; font-size: 15px;"><strong>${expiryDateFormatted}</strong></td>
                    </tr>
                    ` : ''}
                  </table>
                </div>
                
                <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 20px; margin: 25px 0;">
                  <h4 style="color: #856404; margin: 0 0 10px 0; font-size: 16px; font-weight: 600;">💡 Next Steps:</h4>
                  <ul style="color: #856404; margin: 0; padding-left: 20px; line-height: 1.8; font-size: 14px;">
                    <li>Review the attached offer letter carefully</li>
                    <li>Consider all terms and conditions</li>
                    ${expiryDate ? `<li>Respond by the deadline: ${expiryDateFormatted}</li>` : '<li>Respond at your earliest convenience</li>'}
                    <li>Log in to your candidate portal to view and respond to the offer</li>
                  </ul>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/candidate/dashboard" 
                     style="background: linear-gradient(135deg, #114373, #0d3559); color: white; padding: 14px 28px; text-decoration: none; border-radius: 50px; display: inline-block; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.2);">
                    View Offer in Portal
                  </a>
                </div>
                
                <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin-top: 25px;">
                  If you have any questions about this offer, please contact us through your candidate portal.
                </p>
                
                <p style="color: #1e293b; font-size: 16px; margin-top: 30px;">
                  Best regards,<br>
                  <strong>The Axia HR Team</strong>
                </p>
              </div>
              
              <div style="background: #114373; color: white; padding: 20px; text-align: center; border-radius: 0 0 12px 12px; font-size: 12px;">
                <p style="margin: 0;">© 2024 Axia HR Advisory. All rights reserved.</p>
              </div>
            </div>
          `;

          await sendEmail({
            to: candidate.email,
            subject: `Offer Letter - ${positionTitle || candidate.job_title}`,
            html: emailHtml,
            attachments: fileBuffer ? [{
              filename: fileName,
              content: fileBuffer,
              contentType: fileName.endsWith('.pdf') ? 'application/pdf' : 
                          fileName.endsWith('.docx') ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' :
                          fileName.endsWith('.doc') ? 'application/msword' : 'application/octet-stream'
            }] : undefined
          });
        } catch (emailError) {
          console.error('Error sending offer letter email:', emailError);
          // Don't fail the whole operation if email sending fails
        }
      }

      return NextResponse.json({
        success: true,
        offerLetterId,
        message: 'Offer letter uploaded and sent to candidate successfully'
      });
    } catch (dbError: any) {
      console.error('Database error creating offer letter:', dbError);
      // Check if table doesn't exist
      if (dbError?.message?.includes("doesn't exist") || dbError?.code === 'ER_NO_SUCH_TABLE') {
        return NextResponse.json(
          { 
            error: 'Database table not found. Please run the SQL script to create the offer_letters table.',
            details: 'The offer_letters table needs to be created. See create-offer-letters-table.sql file.'
          },
          { status: 500 }
        );
      }
      throw dbError; // Re-throw to be caught by outer catch
    }

  } catch (error: any) {
    console.error('Error uploading offer letter:', error);
    return NextResponse.json(
      { 
        error: 'Failed to upload offer letter',
        details: error?.message || 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

// PUT /api/offer-letters/[id]/response - Handle candidate response
export async function PUT(request: NextRequest) {
  console.log(`🔄 ========== OFFER RESPONSE API CALLED ==========`);
  try {
    // Get token from cookies or Authorization header
    const token = request.cookies.get('candidateAuthToken')?.value || 
                  request.cookies.get('authToken')?.value ||
                  request.headers.get('authorization')?.replace('Bearer ', '');

    console.log(`🔄 Token present: ${!!token}`);

    if (!token) {
      console.error('❌ No token provided');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify token
    let decoded: any;
    try {
      decoded = verifyToken(token);
      console.log(`🔄 Token decoded successfully, candidateId:`, decoded.sub || decoded.candidateId || decoded.id);
    } catch (error) {
      console.error('❌ Token verification failed:', error);
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const candidateId = decoded.sub || decoded.candidateId || decoded.id;
    if (!candidateId) {
      console.error('❌ Candidate ID not found in token');
      return NextResponse.json(
        { error: 'Invalid token: candidate ID not found' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const offerLetterId = searchParams.get('id');
    const body = await request.json();
    const { response, rejectionReason } = body;

    console.log(`🔄 Offer response request:`, {
      offerLetterId,
      response,
      candidateId,
      hasRejectionReason: !!rejectionReason
    });

    if (!offerLetterId) {
      return NextResponse.json(
        { error: 'Offer Letter ID is required' },
        { status: 400 }
      );
    }

    // Verify that the offer letter belongs to this candidate
    const offerCheck = await executeQuery(`
      SELECT ol.id, a.candidate_id
      FROM offer_letters ol
      INNER JOIN applications a ON ol.application_id = a.id
      WHERE ol.id = ? AND a.candidate_id = ?
    `, [offerLetterId, candidateId]);

    if (offerCheck.length === 0) {
      return NextResponse.json(
        { error: 'Offer letter not found or you do not have permission to respond to this offer' },
        { status: 403 }
      );
    }

    // Validate response
    if (!['accepted', 'rejected'].includes(response)) {
      return NextResponse.json(
        { error: 'Invalid response. Must be accepted or rejected' },
        { status: 400 }
      );
    }

    // If rejected, rejection reason is required
    if (response === 'rejected' && !rejectionReason) {
      return NextResponse.json(
        { error: 'Rejection reason is required when rejecting offer' },
        { status: 400 }
      );
    }

    // Update offer letter
    console.log(`🔄 Updating offer letter ${offerLetterId} with response: ${response}`);
    await executeSingleQuery(`
      UPDATE offer_letters 
      SET candidate_response = ?, rejection_reason = ?, response_date = CURRENT_TIMESTAMP,
          status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [response, rejectionReason, response, offerLetterId]);
    console.log(`✅ Offer letter ${offerLetterId} updated successfully`);

    // Get offer letter details for notifications
    const offerDetails = await executeQuery(`
      SELECT ol.application_id, ol.employer_id, c.first_name, c.surname as last_name, j.title as job_title
      FROM offer_letters ol
      JOIN applications a ON ol.application_id = a.id
      JOIN candidates c ON a.candidate_id = c.id
      JOIN jobs j ON a.job_id = j.id
      WHERE ol.id = ?
    `, [offerLetterId]);

    console.log(`🔄 Fetching offer details for notifications...`);
    if (offerDetails.length > 0) {
      const offer = offerDetails[0];
      console.log(`✅ Offer details found:`, {
        applicationId: offer.application_id,
        employerId: offer.employer_id,
        jobTitle: offer.job_title
      });

      // Create notification for employer
      await executeSingleQuery(`
        INSERT INTO notifications (recipient_id, recipient_type, type, title, message, data)
        VALUES (?, 'employer', 'offer_response', 'Offer Response Received', ?, ?)
      `, [
        offer.employer_id,
        `Candidate ${offer.first_name} ${offer.last_name} has ${response} the offer for ${offer.job_title}`,
        JSON.stringify({ 
          offerLetterId, 
          applicationId: offer.application_id,
          response,
          rejectionReason,
          candidateName: `${offer.first_name} ${offer.last_name}`
        })
      ]);

      // Create notification for admin
      await executeSingleQuery(`
        INSERT INTO notifications (recipient_id, recipient_type, type, title, message, data)
        VALUES (?, 'admin', 'offer_response', 'Offer Response Received', ?, ?)
      `, [
        1, // Assuming admin user ID is 1
        `Candidate ${offer.first_name} ${offer.last_name} has ${response} the offer for ${offer.job_title}`,
        JSON.stringify({ 
          offerLetterId, 
          applicationId: offer.application_id,
          response,
          rejectionReason,
          candidateName: `${offer.first_name} ${offer.last_name}`
        })
      ]);

      // If accepted, generate invoice and send to employer
      if (response === 'accepted') {
        console.log(`📧 ========== INVOICE GENERATION START ==========`);
        console.log(`📧 Offer ${offerLetterId} accepted - Starting invoice generation...`);
        console.log(`📧 Response value: ${response}, OfferLetterId: ${offerLetterId}`);
        try {
          // First, check if invoices table exists
          try {
            const tableCheck = await executeQuery(`
              SELECT COUNT(*) as count FROM information_schema.tables 
              WHERE table_schema = DATABASE() AND table_name = 'invoices'
            `, []);
            console.log(`📧 Invoices table check result:`, tableCheck);
            if (tableCheck.length === 0 || tableCheck[0].count === 0) {
              console.error('❌ Invoices table does not exist in database!');
              console.error('❌ Please run the create-invoices-table.sql script to create the table.');
              throw new Error('Invoices table does not exist');
            }
            console.log(`✅ Invoices table exists`);
          } catch (tableCheckError: any) {
            // Try alternative method to check table
            try {
              await executeQuery(`SELECT 1 FROM invoices LIMIT 1`, []);
              console.log(`✅ Invoices table exists (verified via SELECT)`);
            } catch (altError: any) {
              console.error('❌ Invoices table does not exist. Error:', altError.message);
              console.error('❌ Please run: CREATE TABLE invoices ... (see create-invoices-table.sql)');
              throw new Error(`Invoices table does not exist: ${altError.message}`);
            }
          }

          // Generate invoice directly
          console.log(`📧 Fetching offer details for invoice generation...`);
          const invoiceDetails = await executeQuery(`
            SELECT 
              ol.id as offer_letter_id,
              ol.offer_amount,
              ol.position_title,
              ol.application_id,
              ol.employer_id,
              a.candidate_id,
              a.job_id,
              c.first_name as candidate_first_name,
              c.surname as candidate_last_name,
              j.title as job_title,
              e.company_name,
              e.email as employer_email,
              e.first_name as employer_first_name,
              e.last_name as employer_last_name,
              CONCAT_WS(', ', 
                NULLIF(e.street_name, ''),
                NULLIF(e.city, ''),
                NULLIF(e.country, '')
              ) as employer_address,
              e.city as employer_city,
              e.country as employer_country
            FROM offer_letters ol
            JOIN applications a ON ol.application_id = a.id
            JOIN candidates c ON a.candidate_id = c.id
            JOIN jobs j ON a.job_id = j.id
            JOIN employers e ON ol.employer_id = e.id
            WHERE ol.id = ?
          `, [offerLetterId]);
          console.log(`📧 Invoice details query result:`, invoiceDetails.length, 'rows found');

          if (invoiceDetails.length > 0) {
            const offer = invoiceDetails[0];
            console.log(`✅ Found offer details for invoice generation:`, {
              offerLetterId,
              applicationId: offer.application_id,
              employerId: offer.employer_id,
              offerAmount: offer.offer_amount
            });
            
            // Check if invoice already exists
            const existingInvoice = await executeQuery(`
              SELECT id FROM invoices WHERE offer_letter_id = ?
            `, [offerLetterId]);

            if (existingInvoice.length === 0) {
              console.log(`📝 No existing invoice found - Creating new invoice...`);
              
              // Get employer's approved agreement to determine pricing
              const agreementDetails = await executeQuery(`
                SELECT 
                  id,
                  service_type,
                  placement_fee_amount,
                  agreement_content
                FROM employer_agreements
                WHERE employer_id = ?
                AND status IN ('approved', 'signed')
                AND service_type = 'end-to-end'
                ORDER BY 
                  CASE WHEN status = 'approved' THEN 1 ELSE 2 END,
                  approved_at DESC, signed_at DESC, created_at DESC
                LIMIT 1
              `, [offer.employer_id]);

              // Calculate invoice amount based on agreement terms
              // According to agreement: "The Agency's fees shall be calculated as the employee's one-month Gross Salary or TSH 800,000/-, whichever is higher."
              const offerAmount = parseFloat(offer.offer_amount || '0');
              const minimumFee = 800000; // TSH 800,000 minimum
              let subtotal = 0;
              let commissionRate = 0;
              
              // ALWAYS calculate based on agreement terms: max(offer_amount, 800000)
              // Do NOT use stored placement_fee_amount as it may be incorrect for different offers
              // According to agreement: "The Agency's fees shall be calculated as the employee's one-month Gross Salary or TSH 800,000/-, whichever is higher."
              subtotal = Math.max(offerAmount, minimumFee);
              
              // Calculate commission rate for display
              if (offerAmount > 0) {
                commissionRate = (subtotal / offerAmount) * 100;
              } else {
                commissionRate = 0;
              }
              
              console.log(`💰 Invoice calculation:`, {
                offerAmount,
                minimumFee,
                calculatedSubtotal: subtotal,
                commissionRate: `${commissionRate.toFixed(2)}%`
              });

              // Tax calculation (VAT if applicable - currently 0%)
              const taxRate = 0.00;
              const taxAmount = (subtotal * taxRate) / 100;
              const totalAmount = subtotal + taxAmount;

              // Generate invoice number
              const date = new Date();
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const day = String(date.getDate()).padStart(2, '0');
              const randomSuffix = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
              const invoiceNumber = `INV-${year}${month}${day}-${randomSuffix}`;

              // Calculate due date (15 days from invoice date as per agreement)
              const invoiceDate = new Date();
              const dueDate = new Date(invoiceDate);
              dueDate.setDate(dueDate.getDate() + 15);

              // Create invoice
              console.log(`📧 Attempting to insert invoice with values:`, {
                invoiceNumber,
                offerLetterId,
                applicationId: offer.application_id,
                employerId: offer.employer_id,
                candidateId: offer.candidate_id,
                jobId: offer.job_id,
                subtotal,
                taxRate,
                taxAmount,
                totalAmount,
                currency: 'TZS',
                commissionRate,
                offerAmount,
                invoiceDate: invoiceDate.toISOString().split('T')[0],
                dueDate: dueDate.toISOString().split('T')[0]
              });

              const invoiceResult = await executeSingleQuery(`
                INSERT INTO invoices (
                  invoice_number, offer_letter_id, application_id, employer_id, candidate_id, job_id,
                  subtotal, tax_rate, tax_amount, total_amount, currency, commission_rate, offer_amount,
                  status, invoice_date, due_date, notes
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'sent', ?, ?, ?)
              `, [
                invoiceNumber, offerLetterId, offer.application_id, offer.employer_id,
                offer.candidate_id, offer.job_id, subtotal, taxRate, taxAmount, totalAmount,
                'TZS', commissionRate, offerAmount,
                invoiceDate.toISOString().split('T')[0],
                dueDate.toISOString().split('T')[0],
                `Placement fee for ${offer.position_title || offer.job_title} - ${offer.candidate_first_name} ${offer.candidate_last_name}. Fee calculated as per agreement: one-month gross salary (${formatCurrencyForOffer(offerAmount)}) or TZS 800,000, whichever is higher.`
              ]);

              const invoiceId = invoiceResult.insertId;
              console.log(`📧 Invoice INSERT result:`, invoiceResult);
              console.log(`📧 Invoice ID from insertId:`, invoiceId);
              
              // Verify invoice was actually created
              if (invoiceId) {
                const verifyInvoice = await executeQuery(`
                  SELECT id, invoice_number, total_amount, currency, status 
                  FROM invoices 
                  WHERE id = ?
                `, [invoiceId]);
                console.log(`📧 Invoice verification query result:`, verifyInvoice);
                if (verifyInvoice.length > 0) {
                  console.log(`✅ Invoice verified in database:`, verifyInvoice[0]);
                } else {
                  console.error(`❌ Invoice was not found in database after insert!`);
                }
              } else {
                console.error(`❌ Invoice ID is null or undefined!`);
              }
              
              console.log(`✅ Invoice generated successfully:`, {
                invoiceId,
                invoiceNumber,
                offerLetterId,
                employerId: offer.employer_id,
                applicationId: offer.application_id,
                totalAmount,
                currency: 'TZS'
              });

              // Create Stripe payment link for the invoice
              let paymentLink = null;
              try {
                const Stripe = require('stripe');
                const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
                  apiVersion: '2025-10-29.clover' as any,
                });

                // Convert TZS to USD for Stripe (Stripe doesn't support TZS)
                // Exchange rate: 1 USD = 2500 TZS (configurable via TZS_TO_USD_RATE env var)
                // To ensure exact conversion: Calculate USD that when * rate = exact TZS amount
                const TZS_TO_USD_RATE = parseFloat(process.env.TZS_TO_USD_RATE || '2500');
                
                // Calculate USD amount that converts back to exact TZS
                // We want: USD * rate = TZS, so USD = TZS / rate
                // But we need to round USD to nearest cent, so we calculate backwards:
                // Find the USD amount (rounded to cents) that when multiplied by rate gives us closest to TZS
                const amountInUSD = totalAmount / TZS_TO_USD_RATE;
                // Round to nearest cent
                const amountInUSDRounded = Math.round(amountInUSD * 100) / 100;
                // Calculate what TZS this USD amount converts back to
                const convertedBackTZS = amountInUSDRounded * TZS_TO_USD_RATE;
                const difference = Math.abs(convertedBackTZS - totalAmount);
                
                // If difference is significant, adjust USD amount to minimize it
                let finalAmountInUSD = amountInUSDRounded;
                if (difference > 0.5) {
                  // Try rounding up or down to see which gives better result
                  const amountUp = Math.ceil(amountInUSD * 100) / 100;
                  const amountDown = Math.floor(amountInUSD * 100) / 100;
                  const diffUp = Math.abs(amountUp * TZS_TO_USD_RATE - totalAmount);
                  const diffDown = Math.abs(amountDown * TZS_TO_USD_RATE - totalAmount);
                  finalAmountInUSD = diffUp < diffDown ? amountUp : amountDown;
                }
                
                const amountInCents = Math.round(finalAmountInUSD * 100);
                
                // Log conversion details for debugging
                const finalConvertedBackTZS = finalAmountInUSD * TZS_TO_USD_RATE;
                const finalDifference = Math.abs(finalConvertedBackTZS - totalAmount);
                if (finalDifference > 1) {
                  console.warn(`⚠️ Currency conversion: TZS ${totalAmount} → USD $${finalAmountInUSD} → TZS ${finalConvertedBackTZS} (diff: ${finalDifference.toFixed(2)})`);
                }

                // Format TZS amount for display
                const formattedTZSAmount = new Intl.NumberFormat('en-TZ', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0
                }).format(totalAmount);

                const session = await stripe.checkout.sessions.create({
                  payment_method_types: ['card'],
                  line_items: [
                    {
                      price_data: {
                        currency: 'usd', // Stripe doesn't support TZS, using USD
                        product_data: {
                          name: `Invoice ${invoiceNumber}`,
                          description: `Placement Fee - ${offer.position_title || offer.job_title} - ${offer.candidate_first_name} ${offer.candidate_last_name}\n\nOriginal Amount: TZS ${formattedTZSAmount}`,
                        },
                        unit_amount: amountInCents,
                      },
                      quantity: 1,
                    },
                  ],
                  mode: 'payment',
                  success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/employer/invoices?payment=success&session_id={CHECKOUT_SESSION_ID}`,
                  cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/employer/invoices?payment=cancelled`,
                  customer_email: offer.employer_email,
                  metadata: {
                    invoice_id: invoiceId.toString(),
                    invoice_number: invoiceNumber,
                    employer_id: offer.employer_id.toString(),
                    original_amount_tzs: totalAmount.toString(),
                    original_currency: 'TZS',
                    exchange_rate: TZS_TO_USD_RATE.toString(),
                  },
                  invoice_creation: {
                    enabled: true,
                  },
                });

                paymentLink = session.url;

                // Update invoice with payment link
                await executeSingleQuery(`
                  UPDATE invoices 
                  SET payment_link = ?
                  WHERE id = ?
                `, [paymentLink, invoiceId]);

                // Create payment record
                // Use offer_letter_id as the payments table structure requires it
                await executeSingleQuery(`
                  INSERT INTO payments (
                    offer_letter_id, employer_id, amount, currency, 
                    payment_method, payment_status, stripe_payment_intent_id
                  ) VALUES (?, ?, ?, ?, 'stripe', 'pending', ?)
                `, [offerLetterId, offer.employer_id, totalAmount, 'TZS', session.id]);

                console.log(`✅ Payment link created for invoice ${invoiceId}:`, paymentLink?.substring(0, 50) + '...');
              } catch (stripeError: any) {
                console.error('❌ Error creating Stripe payment link:', stripeError);
                console.error('⚠️ Continuing without payment link - it can be created later via the invoice page');
                // Continue without payment link - it can be created later
              }

              // Send invoice via email (with payment link if available)
              try {
                console.log(`📧 Preparing to send invoice email to ${offer.employer_email}...`);
                console.log(`📧 Payment link status: ${paymentLink ? 'Available' : 'Not available (will show bank details)'}`);
                
                const { sendEmail } = await import('@/lib/email');
                const invoiceHtml = generateInvoiceEmailHTMLForOffer({
                  ...offer,
                  invoice_number: invoiceNumber,
                  subtotal,
                  tax_rate: taxRate,
                  tax_amount: taxAmount,
                  total_amount: totalAmount,
                  currency: 'TZS',
                  commission_rate: commissionRate,
                  offer_amount: offerAmount,
                  invoice_date: invoiceDate.toISOString().split('T')[0],
                  due_date: dueDate.toISOString().split('T')[0],
                  payment_link: paymentLink, // Include payment link in email
                  notes: `Placement fee for ${offer.position_title || offer.job_title} - ${offer.candidate_first_name} ${offer.candidate_last_name}. Fee calculated as per agreement: one-month gross salary (${formatCurrencyForOffer(offerAmount)}) or TZS 800,000, whichever is higher.`
                });

                await sendEmail({
                  to: offer.employer_email,
                  subject: `Invoice ${invoiceNumber} - Placement Fee`,
                  html: invoiceHtml,
                });
                
                console.log(`✅ Invoice email sent successfully to ${offer.employer_email}`);
                console.log(`✅ Email includes: Invoice details, Payment instructions`);
                console.log(`✅ Payment link in email: ${paymentLink ? '✅ YES - Pay Now button included' : '❌ NO - Bank details shown instead'}`);
              } catch (emailError) {
                console.error('❌ Error sending invoice email:', emailError);
                console.error('❌ Email error details:', {
                  to: offer.employer_email,
                  subject: `Invoice ${invoiceNumber} - Placement Fee`,
                  hasPaymentLink: !!paymentLink
                });
                // Don't fail offer acceptance if email fails
              }
              console.log(`✅ ========== INVOICE GENERATION COMPLETED SUCCESSFULLY ==========`);
            } else {
              console.log(`ℹ️ Invoice already exists for offer ${offerLetterId}`);
            }
          } else {
            console.log(`⚠️ Invoice generation skipped - offer details not found for offerLetterId: ${offerLetterId}`);
          }
        } catch (invoiceError: any) {
          console.error(`❌ ========== INVOICE GENERATION ERROR ==========`);
          console.error('❌ Full error object:', JSON.stringify(invoiceError, null, 2));
          console.error('❌ Error type:', typeof invoiceError);
          console.error('❌ Error constructor:', invoiceError?.constructor?.name);
          
          // If invoices table doesn't exist, log but don't fail the offer acceptance
          if (invoiceError?.code === 'ER_NO_SUCH_TABLE' || 
              invoiceError?.message?.includes("doesn't exist") ||
              invoiceError?.message?.includes("Unknown table") ||
              invoiceError?.sqlMessage?.includes("doesn't exist") ||
              invoiceError?.sqlMessage?.includes("Unknown table")) {
            console.error('❌ Invoices table does not exist. Please run create-invoices-table.sql to create it.');
            console.error('❌ Error code:', invoiceError?.code);
            console.error('❌ Error message:', invoiceError?.message);
            console.error('❌ SQL message:', invoiceError?.sqlMessage);
            console.error('❌ SQL state:', invoiceError?.sqlState);
          } else {
            console.error('❌ Error generating invoice:', invoiceError);
            console.error('❌ Error code:', invoiceError?.code);
            console.error('❌ Error message:', invoiceError?.message);
            console.error('❌ SQL message:', invoiceError?.sqlMessage);
            console.error('❌ SQL state:', invoiceError?.sqlState);
            console.error('❌ Error stack:', invoiceError?.stack);
            console.error('❌ Full error:', invoiceError);
          }
          console.error(`❌ ========== END INVOICE GENERATION ERROR ==========`);
          // Don't throw - offer acceptance should still succeed
        }
      } else {
        console.log(`ℹ️ Offer response was '${response}' - Invoice generation not needed`);
      }
    } else {
      console.log(`⚠️ Offer details not found for offerLetterId: ${offerLetterId}`);
    }

    console.log(`✅ ========== OFFER RESPONSE API COMPLETED SUCCESSFULLY ==========`);
    console.log(`✅ Returning success response for offer ${offerLetterId}, response: ${response}`);
    
    return NextResponse.json({
      success: true,
      message: `Offer ${response} successfully`
    });

  } catch (error) {
    console.error('Error processing offer response:', error);
    return NextResponse.json(
      { error: 'Failed to process offer response' },
      { status: 500 }
    );
  }
}

// Helper function to format currency
function formatCurrencyForOffer(amount: number, currency: string = 'TZS'): string {
  if (currency === 'TZS') {
    const formatted = new Intl.NumberFormat('en-TZ', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
    return `TZS ${formatted}`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
}

// Helper function to generate invoice email HTML
function generateInvoiceEmailHTMLForOffer(invoice: any) {
  const formatCurrency = (amount: number) => {
    const currency = invoice.currency || 'TZS';
    if (currency === 'TZS') {
      // Format TZS - show as TZS 1,000,000 (without currency symbol from Intl, just add TZS prefix)
      const formatted = new Intl.NumberFormat('en-TZ', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount);
      return `TZS ${formatted}`;
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invoice ${invoice.invoice_number}</title>
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
      <div style="max-width: 800px; margin: 0 auto; background-color: #ffffff; padding: 40px;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #114373 0%, #0d3559 100%); padding: 30px; border-radius: 12px 12px 0 0; margin-bottom: 30px;">
          <div style="text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 28px; font-weight: 600;">Axia HR Advisory</h1>
            <p style="margin: 10px 0 0; font-size: 16px; opacity: 0.9;">Professional HR Solutions</p>
          </div>
        </div>

        <!-- Invoice Title -->
        <div style="text-align: center; margin-bottom: 40px;">
          <h2 style="color: #114373; font-size: 32px; margin: 0; font-weight: 700;">INVOICE</h2>
          <p style="color: #64748b; font-size: 16px; margin: 10px 0 0;">Invoice #${invoice.invoice_number}</p>
        </div>

        <!-- Invoice Details -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 40px;">
          <div>
            <h3 style="color: #1e293b; font-size: 14px; font-weight: 600; margin: 0 0 10px; text-transform: uppercase; letter-spacing: 0.5px;">Bill To:</h3>
            <p style="color: #1e293b; margin: 5px 0; font-size: 16px; font-weight: 600;">${invoice.company_name}</p>
            <p style="color: #64748b; margin: 5px 0; font-size: 14px;">${invoice.employer_first_name} ${invoice.employer_last_name}</p>
            ${invoice.employer_address ? `<p style="color: #64748b; margin: 5px 0; font-size: 14px;">${invoice.employer_address}</p>` : ''}
            ${invoice.employer_city ? `<p style="color: #64748b; margin: 5px 0; font-size: 14px;">${invoice.employer_city}${invoice.employer_country ? ', ' + invoice.employer_country : ''}</p>` : ''}
            ${invoice.employer_email ? `<p style="color: #64748b; margin: 5px 0; font-size: 14px;">${invoice.employer_email}</p>` : ''}
          </div>
          <div style="text-align: right;">
            <div style="margin-bottom: 15px;">
              <p style="color: #64748b; margin: 5px 0; font-size: 14px;">Invoice Date:</p>
              <p style="color: #1e293b; margin: 5px 0; font-size: 16px; font-weight: 600;">${formatDate(invoice.invoice_date)}</p>
            </div>
            <div>
              <p style="color: #64748b; margin: 5px 0; font-size: 14px;">Due Date:</p>
              <p style="color: #ef4444; margin: 5px 0; font-size: 16px; font-weight: 600;">${formatDate(invoice.due_date)}</p>
            </div>
          </div>
        </div>

        <!-- Service Details -->
        <div style="background: #f8fafc; border-radius: 8px; padding: 25px; margin-bottom: 30px;">
          <h3 style="color: #1e293b; font-size: 16px; font-weight: 600; margin: 0 0 20px;">Service Details</h3>
          <div style="background: white; border-radius: 6px; padding: 20px;">
            <p style="color: #1e293b; margin: 0 0 10px; font-size: 16px; font-weight: 600;">
              Placement Fee
            </p>
            <p style="color: #64748b; margin: 5px 0; font-size: 14px;">
              <strong>Position:</strong> ${invoice.position_title || invoice.job_title}
            </p>
            <p style="color: #64748b; margin: 5px 0; font-size: 14px;">
              <strong>Candidate:</strong> ${invoice.candidate_first_name} ${invoice.candidate_last_name}
            </p>
            <p style="color: #64748b; margin: 5px 0; font-size: 14px;">
              <strong>Offer Amount:</strong> ${formatCurrency(parseFloat(invoice.offer_amount || '0'))}
            </p>
          </div>
        </div>

        <!-- Invoice Items Table -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
          <thead>
            <tr style="background: #f8fafc;">
              <th style="text-align: left; padding: 15px; color: #1e293b; font-size: 14px; font-weight: 600; border-bottom: 2px solid #e2e8f0;">Description</th>
              <th style="text-align: right; padding: 15px; color: #1e293b; font-size: 14px; font-weight: 600; border-bottom: 2px solid #e2e8f0;">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding: 15px; color: #1e293b; font-size: 14px; border-bottom: 1px solid #e2e8f0;">
                Placement Fee
              </td>
              <td style="text-align: right; padding: 15px; color: #1e293b; font-size: 14px; border-bottom: 1px solid #e2e8f0;">
                ${formatCurrency(parseFloat(invoice.subtotal))}
              </td>
            </tr>
            ${parseFloat(invoice.tax_amount) > 0 ? `
            <tr>
              <td style="padding: 15px; color: #1e293b; font-size: 14px; border-bottom: 1px solid #e2e8f0;">
                Tax (${invoice.tax_rate}%)
              </td>
              <td style="text-align: right; padding: 15px; color: #1e293b; font-size: 14px; border-bottom: 1px solid #e2e8f0;">
                ${formatCurrency(parseFloat(invoice.tax_amount))}
              </td>
            </tr>
            ` : ''}
          </tbody>
        </table>

        <!-- Total -->
        <div style="background: linear-gradient(135deg, #114373 0%, #0d3559 100%); border-radius: 8px; padding: 25px; margin-bottom: 30px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="color: white; font-size: 18px; font-weight: 600;">Total Amount Due:</span>
            <span style="color: white; font-size: 28px; font-weight: 700;">${formatCurrency(parseFloat(invoice.total_amount))}</span>
          </div>
        </div>

        <!-- Payment Instructions -->
        <div style="background: #f0f9ff; border: 2px solid #0284c7; border-radius: 12px; padding: 30px; margin-bottom: 30px; text-align: center;">
          <h3 style="color: #0c4a6e; font-size: 20px; font-weight: 700; margin: 0 0 15px;">💳 Make Payment</h3>
          <p style="color: #075985; margin: 0 0 25px; font-size: 16px; line-height: 1.6;">
            Payment due within <strong>15 days</strong> from invoice date
          </p>
          ${invoice.payment_link ? `
          <div style="margin: 0;">
            <a href="${invoice.payment_link}" 
               style="display: inline-block; background: linear-gradient(135deg, #114373 0%, #0d3559 100%); color: white; padding: 18px 40px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 18px; box-shadow: 0 6px 12px rgba(17, 67, 115, 0.3); transition: transform 0.2s;">
              💳 Pay Now - ${formatCurrency(parseFloat(invoice.total_amount))}
            </a>
          </div>
          <p style="color: #64748b; margin: 20px 0 0; font-size: 14px; line-height: 1.6;">
            Secure payment via Stripe
          </p>
          ` : `
          <p style="color: #92400e; margin: 10px 0 0; font-size: 14px; line-height: 1.6;">
            <strong>Bank Details:</strong><br>
            Account Name: Axia HR Advisory<br>
            Account Number: [Your Account Number]<br>
            Bank: [Your Bank Name]<br>
            SWIFT Code: [Your SWIFT Code]
          </p>
          `}
        </div>

        <!-- Notes -->
        ${invoice.notes ? `
        <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
          <h3 style="color: #1e293b; font-size: 14px; font-weight: 600; margin: 0 0 10px;">Notes:</h3>
          <p style="color: #64748b; margin: 0; font-size: 14px; line-height: 1.6;">${invoice.notes}</p>
        </div>
        ` : ''}

        <!-- Footer -->
        <div style="text-align: center; padding-top: 30px; border-top: 2px solid #e2e8f0; margin-top: 40px;">
          <p style="color: #64748b; margin: 5px 0; font-size: 14px;">
            Thank you for your business!
          </p>
          <p style="color: #64748b; margin: 5px 0; font-size: 14px;">
            If you have any questions about this invoice, please contact us.
          </p>
          <p style="color: #94a3b8; margin: 20px 0 0; font-size: 12px;">
            © ${new Date().getFullYear()} Axia HR Advisory. All rights reserved.
          </p>
        </div>

      </div>
    </body>
    </html>
  `;
}
