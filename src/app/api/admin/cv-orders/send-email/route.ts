import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeSingleQuery } from '@/lib/database';
import { verifyToken } from '@/lib/auth';
import { sendEmail } from '@/lib/email';
import { readFile } from 'fs/promises';
import { join } from 'path';

// POST /api/admin/cv-orders/send-email - Send processed CV to candidate via email
export async function POST(request: NextRequest) {
  try {
    // Get token for authentication
    const authHeader = request.headers.get('authorization')?.replace('Bearer ', '');
    const adminAuthTokenCookie = request.cookies.get('adminAuthToken')?.value;
    const axiaAdminTokenCookie = request.cookies.get('axia_admin_token')?.value;
    const token = authHeader || adminAuthTokenCookie || axiaAdminTokenCookie;

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

    // Check if user is admin
    const userRole = decoded.role || decoded.type;
    if (userRole !== 'admin' && userRole !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Get order details with candidate information
    const orders = await executeQuery(
      `SELECT 
        co.*,
        c.email,
        c.first_name,
        c.surname
       FROM cv_orders co
       JOIN candidates c ON co.candidate_id = c.id
       WHERE co.id = ? AND co.payment_status = 'completed' AND co.processed_cv_path IS NOT NULL`,
      [orderId]
    );

    if (orders.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Order not found, payment not completed, or processed CV not available' },
        { status: 404 }
      );
    }

    const order = orders[0];
    const candidateName = `${order.first_name} ${order.surname || ''}`.trim();

    // Read the processed CV file
    const filePath = join(process.cwd(), 'public', order.processed_cv_path);
    let fileBuffer: Buffer | undefined;
    let fileName: string;

    try {
      fileBuffer = await readFile(filePath);
      fileName = order.processed_cv_path.split('/').pop() || 'processed_cv.pdf';
    } catch (fileError) {
      console.error('Error reading processed CV file:', fileError);
      return NextResponse.json(
        { success: false, error: 'Processed CV file not found' },
        { status: 404 }
      );
    }

    // Generate email HTML
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #114373 0%, #0d3559 100%); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 600;">Axia HR Advisory</h1>
          <p style="margin: 5px 0 0 0; font-size: 16px; opacity: 0.9;">Your Professional CV is Ready!</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 12px 12px;">
          <h2 style="color: #114373; margin-top: 0; font-size: 20px;">Hello ${candidateName},</h2>
          
          <p style="color: #1e293b; font-size: 16px; line-height: 1.6;">
            Great news! Your professionally crafted CV has been completed and is ready for download.
          </p>
          
          <div style="background: white; border-left: 4px solid #114373; padding: 20px; margin: 25px 0; border-radius: 4px;">
            <p style="margin: 0; color: #1e293b; font-size: 15px; line-height: 1.6;">
              <strong>Order Details:</strong><br>
              Order ID: #${order.id}<br>
              Amount Paid: TZS ${new Intl.NumberFormat('en-TZ', { minimumFractionDigits: 0 }).format(order.amount_tzs)}<br>
              Status: Completed
            </p>
          </div>
          
          <p style="color: #1e293b; font-size: 16px; line-height: 1.6;">
            Your processed CV is attached to this email. You can also download it anytime from your candidate dashboard.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/candidate/cv-builder" 
               style="background: linear-gradient(135deg, #114373, #0d3559); color: white; padding: 14px 28px; text-decoration: none; border-radius: 50px; display: inline-block; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.2);">
              View in Dashboard
            </a>
          </div>
          
          <div style="background: #e0f2fe; border: 1px solid #0ea5e9; border-radius: 8px; padding: 15px; margin: 25px 0;">
            <p style="margin: 0; color: #0c4a6e; font-size: 14px; line-height: 1.6;">
              <strong>💡 Tip:</strong> Keep this CV file safe. You can use it to apply for jobs through our platform or share it directly with employers.
            </p>
          </div>
          
          <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin-top: 25px;">
            If you have any questions or need assistance, please don't hesitate to contact our support team through your candidate portal.
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

    // Send email with attachment
    try {
      await sendEmail({
        to: order.email,
        subject: `Your Professional CV is Ready - Order #${order.id}`,
        html: emailHtml,
        attachments: [{
          filename: fileName,
          content: fileBuffer,
          contentType: fileName.endsWith('.pdf') ? 'application/pdf' : 
                      fileName.endsWith('.docx') ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' :
                      fileName.endsWith('.doc') ? 'application/msword' : 'application/octet-stream'
        }]
      });

      // Update order to mark as delivered
      await executeSingleQuery(
        `UPDATE cv_orders 
         SET status = 'delivered',
             delivered_at = NOW(),
             updated_at = NOW()
         WHERE id = ?`,
        [orderId]
      );

      console.log('✅ CV email sent successfully:', {
        orderId,
        candidateEmail: order.email,
        candidateName
      });

      return NextResponse.json({
        success: true,
        message: 'CV sent to candidate successfully',
        orderId: parseInt(orderId)
      });

    } catch (emailError: any) {
      console.error('Error sending CV email:', emailError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to send email: ' + emailError.message 
        },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('❌ Error sending CV email:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to send CV email' 
      },
      { status: 500 }
    );
  }
}

