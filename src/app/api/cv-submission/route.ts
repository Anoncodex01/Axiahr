import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { sendEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const cvFile = formData.get('cvFile') as File;
    const candidateId = formData.get('candidateId') as string;
    const paymentAmount = formData.get('paymentAmount') as string;
    const paymentStatus = formData.get('paymentStatus') as string;

    if (!cvFile) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'cv-submissions');
    
    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = cvFile.name.split('.').pop();
    const fileName = `cv-${candidateId}-${timestamp}.${fileExtension}`;
    const filePath = join(uploadsDir, fileName);

    // Convert file to buffer and save
    const bytes = await cvFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Save submission to database (you'll need to implement your database logic here)
    const submissionData = {
      id: `submission-${timestamp}`,
      candidateId,
      fileName,
      filePath,
      paymentAmount: parseInt(paymentAmount),
      paymentStatus,
      status: 'pending',
      submittedAt: new Date().toISOString(),
      estimatedCompletion: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(), // 72 hours from now
    };

    // TODO: Save to database
    console.log('CV Submission Data:', submissionData);

    // Send notification email to admin
    try {
      await sendEmail({
        to: 'admin@axia.co.tz', // Replace with actual admin email
        subject: 'New CV Submission - Professional CV Generation',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #114373;">New CV Submission</h2>
            <p>A candidate has submitted their CV for professional generation.</p>
            
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #114373; margin-top: 0;">Submission Details</h3>
              <p><strong>Candidate ID:</strong> ${candidateId}</p>
              <p><strong>File Name:</strong> ${cvFile.name}</p>
              <p><strong>Payment Amount:</strong> TZS ${paymentAmount}</p>
              <p><strong>Status:</strong> ${paymentStatus}</p>
              <p><strong>Submitted At:</strong> ${new Date().toLocaleString()}</p>
              <p><strong>Estimated Completion:</strong> ${new Date(Date.now() + 72 * 60 * 60 * 1000).toLocaleString()}</p>
            </div>
            
            <p>Please process this CV submission and notify the candidate when completed.</p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
              <p style="color: #666; font-size: 14px;">This is an automated notification from the Axia HR system.</p>
            </div>
          </div>
        `,
      });
    } catch (emailError) {
      console.error('Failed to send admin notification email:', emailError);
      // Don't fail the request if email fails
    }

    // Send confirmation email to candidate
    try {
      await sendEmail({
        to: 'candidate@example.com', // This should come from the candidate's profile
        subject: 'CV Submission Confirmed - Professional CV Generation',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #114373;">CV Submission Confirmed</h2>
            <p>Thank you for choosing Axia HR for your professional CV generation!</p>
            
            <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #114373;">
              <h3 style="color: #114373; margin-top: 0;">What happens next?</h3>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Our HR experts will review your submitted CV</li>
                <li>They will create a professional, ATS-optimized version</li>
                <li>Your CV will be tailored to your industry and experience</li>
                <li>You'll receive an email notification when it's ready</li>
              </ul>
            </div>
            
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #114373; margin-top: 0;">Processing Timeline</h3>
              <p><strong>Estimated Completion:</strong> 24-72 hours</p>
              <p><strong>Status:</strong> Submitted and under review</p>
              <p><strong>Submission ID:</strong> ${submissionData.id}</p>
            </div>
            
            <p>We'll notify you as soon as your professional CV is ready for download!</p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
              <p style="color: #666; font-size: 14px;">If you have any questions, please contact our support team.</p>
            </div>
          </div>
        `,
      });
    } catch (emailError) {
      console.error('Failed to send candidate confirmation email:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      submissionId: submissionData.id,
      message: 'CV submitted successfully',
    });

  } catch (error) {
    console.error('Error processing CV submission:', error);
    return NextResponse.json(
      { error: 'Failed to process CV submission' },
      { status: 500 }
    );
  }
}
