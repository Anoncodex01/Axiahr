import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeSingleQuery } from '@/lib/database';
import { sendEmail } from '@/lib/email';

// POST /api/invoices/send - Send invoice to employer via email
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { invoiceId } = body;

    if (!invoiceId) {
      return NextResponse.json(
        { error: 'Invoice ID is required' },
        { status: 400 }
      );
    }

    // Get invoice details
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
        CONCAT_WS(', ', NULLIF(e.street_name, ''), NULLIF(e.city, ''), NULLIF(e.country, '')) as employer_address,
        e.city as employer_city,
        e.country as employer_country,
        e.mobile_phone as employer_phone
      FROM invoices i
      JOIN offer_letters ol ON i.offer_letter_id = ol.id
      JOIN candidates c ON i.candidate_id = c.id
      JOIN jobs j ON i.job_id = j.id
      JOIN employers e ON i.employer_id = e.id
      WHERE i.id = ?
    `, [invoiceId]);

    if (invoiceDetails.length === 0) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    const invoice = invoiceDetails[0];

    // Log payment link for debugging
    console.log('📧 Invoice email - Payment link check:', {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoice_number,
      hasPaymentLink: !!invoice.payment_link,
      paymentLink: invoice.payment_link ? invoice.payment_link.substring(0, 50) + '...' : 'NULL'
    });

    // Generate invoice HTML
    const invoiceHtml = generateInvoiceEmailHTML(invoice);

    // Send email to employer
    try {
      await sendEmail({
        to: invoice.employer_email,
        subject: `Invoice ${invoice.invoice_number} - Recruitment Service Commission`,
        html: invoiceHtml,
      });

      // Update invoice status to 'sent' if it was 'draft'
      if (invoice.status === 'draft') {
        await executeSingleQuery(`
          UPDATE invoices 
          SET status = 'sent', updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [invoiceId]);
      }

      return NextResponse.json({
        success: true,
        message: 'Invoice sent successfully to employer',
        invoiceNumber: invoice.invoice_number
      });

    } catch (emailError: any) {
      console.error('Error sending invoice email:', emailError);
      return NextResponse.json(
        { error: 'Failed to send email: ' + emailError.message },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('Error sending invoice:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send invoice' },
      { status: 500 }
    );
  }
}

function generateInvoiceEmailHTML(invoice: any) {
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
              <strong>Offer Amount:</strong> ${formatCurrency(parseFloat(invoice.offer_amount))}
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

