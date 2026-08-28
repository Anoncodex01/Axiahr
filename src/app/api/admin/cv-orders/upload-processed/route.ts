import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeSingleQuery } from '@/lib/database';
import { verifyToken } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { sendEmail } from '@/lib/email';
import { readFile } from 'fs/promises';

// POST /api/admin/cv-orders/upload-processed - Upload processed CV by admin
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

    // Parse form data
    const formData = await request.formData();
    const orderId = formData.get('orderId') as string;
    const file = formData.get('file') as File;

    if (!orderId || !file) {
      return NextResponse.json(
        { success: false, error: 'Order ID and file are required' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Only PDF, DOC, and DOCX files are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds 10MB limit.' },
        { status: 400 }
      );
    }

    // Verify order exists and payment is completed
    const orders = await executeQuery(
      `SELECT co.*, c.email, c.first_name, c.surname 
       FROM cv_orders co
       JOIN candidates c ON co.candidate_id = c.id
       WHERE co.id = ? AND co.payment_status = 'completed'`,
      [orderId]
    );

    if (orders.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Order not found or payment not completed' },
        { status: 404 }
      );
    }

    const order = orders[0];

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'cv-orders', 'processed');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop();
    const timestamp = Date.now();
    const fileName = `processed_cv_${order.candidate_id}_${orderId}_${timestamp}.${fileExtension}`;
    const filePath = join(uploadsDir, fileName);
    const publicPath = `/uploads/cv-orders/processed/${fileName}`;

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Update order in database
    await executeSingleQuery(
      `UPDATE cv_orders 
       SET processed_cv_path = ?, 
           status = 'completed',
           completed_at = NOW(),
           updated_at = NOW()
       WHERE id = ?`,
      [publicPath, orderId]
    );

    console.log('✅ Processed CV uploaded:', {
      orderId,
      candidateId: order.candidate_id,
      filePath: publicPath
    });

    // Automatically send email to candidate with processed CV
    let emailSent = false;
    let emailError = null;
    
    try {
      // Read the processed CV file
      const fileBuffer = await readFile(filePath);
      const fileName = filePath.split('/').pop() || 'processed_cv.pdf';

      // Generate email HTML
      const candidateName = `${order.first_name} ${order.surname || ''}`.trim();
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

      emailSent = true;
      console.log('✅ CV email sent automatically:', {
        orderId,
        candidateEmail: order.email,
        candidateName
      });
    } catch (emailErr: any) {
      emailError = emailErr.message;
      console.error('⚠️ Failed to send email automatically:', emailErr);
      // Don't fail the upload if email fails - the CV is still uploaded
    }

    return NextResponse.json({
      success: true,
      message: emailSent 
        ? 'Processed CV uploaded and sent to candidate successfully' 
        : 'Processed CV uploaded successfully' + (emailError ? ` (Email failed: ${emailError})` : ''),
      processedCvPath: publicPath,
      orderId: parseInt(orderId),
      emailSent,
      emailError: emailError || undefined
    });

  } catch (error: any) {
    console.error('❌ Error uploading processed CV:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to upload processed CV' 
      },
      { status: 500 }
    );
  }
}

