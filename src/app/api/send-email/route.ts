import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, testEmailConnection } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, subject, text, html, type, data } = body;

    // Validate required fields
    if (!to || !subject) {
      return NextResponse.json(
        { error: 'Missing required fields: to and subject are required' },
        { status: 400 }
      );
    }

    let emailOptions;

    // Handle different email types
    switch (type) {
      case 'welcome':
        if (!data?.name || !data?.loginUrl) {
          return NextResponse.json(
            { error: 'Missing required data for welcome email' },
            { status: 400 }
          );
        }
        emailOptions = {
          to,
          subject: 'Welcome to Axia HR Advisory - Your Account is Ready!',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #114373, #0d3559); padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Axia HR!</h1>
              </div>
              <div style="padding: 30px; background: #f8f9fa;">
                <h2 style="color: #114373; margin-top: 0;">Hello ${data.name},</h2>
                <p>Welcome to Axia HR Advisory! Your account has been successfully created and you're now part of our talent network.</p>
                <p>You can now:</p>
                <ul>
                  <li>Browse and apply for job opportunities</li>
                  <li>Build your professional profile</li>
                  <li>Connect with top employers</li>
                  <li>Access career development resources</li>
                </ul>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${data.loginUrl}" style="background: #114373; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; display: inline-block;">Login to Your Account</a>
                </div>
                <p>If you have any questions, feel free to contact our support team.</p>
                <p>Best regards,<br>The Axia HR Team</p>
              </div>
              <div style="background: #114373; color: white; padding: 20px; text-align: center; font-size: 12px;">
                <p>© 2024 Axia HR Advisory. All rights reserved.</p>
              </div>
            </div>
          `,
        };
        break;

      case 'job-application':
        if (!data?.candidateName || !data?.jobTitle || !data?.companyName) {
          return NextResponse.json(
            { error: 'Missing required data for job application email' },
            { status: 400 }
          );
        }
        emailOptions = {
          to,
          subject: `Application Submitted - ${data.jobTitle} at ${data.companyName}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #114373, #0d3559); padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px;">Application Submitted!</h1>
              </div>
              <div style="padding: 30px; background: #f8f9fa;">
                <h2 style="color: #114373; margin-top: 0;">Hello ${data.candidateName},</h2>
                <p>Thank you for your interest in the <strong>${data.jobTitle}</strong> position at <strong>${data.companyName}</strong>.</p>
                <p>Your application has been successfully submitted and is now under review by the hiring team.</p>
                <p><strong>What happens next?</strong></p>
                <ul>
                  <li>Our team will review your application</li>
                  <li>If shortlisted, you'll be contacted for the next steps</li>
                  <li>You can track your application status in your dashboard</li>
                </ul>
                <p>We'll keep you updated on the progress of your application.</p>
                <p>Best regards,<br>The Axia HR Team</p>
              </div>
              <div style="background: #114373; color: white; padding: 20px; text-align: center; font-size: 12px;">
                <p>© 2024 Axia HR Advisory. All rights reserved.</p>
              </div>
            </div>
          `,
        };
        break;

      case 'password-reset':
        if (!data?.name || !data?.resetUrl) {
          return NextResponse.json(
            { error: 'Missing required data for password reset email' },
            { status: 400 }
          );
        }
        emailOptions = {
          to,
          subject: 'Password Reset Request - Axia HR Advisory',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #114373, #0d3559); padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px;">Password Reset</h1>
              </div>
              <div style="padding: 30px; background: #f8f9fa;">
                <h2 style="color: #114373; margin-top: 0;">Hello ${data.name},</h2>
                <p>We received a request to reset your password for your Axia HR Advisory account.</p>
                <p>Click the button below to reset your password:</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${data.resetUrl}" style="background: #114373; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; display: inline-block;">Reset Password</a>
                </div>
                <p><strong>Important:</strong> This link will expire in 24 hours for security reasons.</p>
                <p>If you didn't request this password reset, please ignore this email.</p>
                <p>Best regards,<br>The Axia HR Team</p>
              </div>
              <div style="background: #114373; color: white; padding: 20px; text-align: center; font-size: 12px;">
                <p>© 2024 Axia HR Advisory. All rights reserved.</p>
              </div>
            </div>
          `,
        };
        break;

      case 'contact':
        if (!data?.name || !data?.email || !data?.message) {
          return NextResponse.json(
            { error: 'Missing required data for contact email' },
            { status: 400 }
          );
        }
        emailOptions = {
          to,
          subject: 'New Contact Form Submission - Axia HR Advisory',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #114373, #0d3559); padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px;">New Contact Form Submission</h1>
              </div>
              <div style="padding: 30px; background: #f8f9fa;">
                <h2 style="color: #114373; margin-top: 0;">Contact Form Details</h2>
                <p><strong>Name:</strong> ${data.name}</p>
                <p><strong>Email:</strong> ${data.email}</p>
                <p><strong>Message:</strong></p>
                <div style="background: white; padding: 15px; border-left: 4px solid #114373; margin: 15px 0;">
                  ${data.message.replace(/\n/g, '<br>')}
                </div>
                <p>Please respond to this inquiry as soon as possible.</p>
              </div>
              <div style="background: #114373; color: white; padding: 20px; text-align: center; font-size: 12px;">
                <p>© 2024 Axia HR Advisory. All rights reserved.</p>
              </div>
            </div>
          `,
        };
        break;

      case 'otp-verification':
        if (!data?.name || !data?.otp) {
          return NextResponse.json(
            { error: 'Missing required data for OTP verification email' },
            { status: 400 }
          );
        }
        emailOptions = {
          to,
          subject: 'Verify Your Email - Axia HR Advisory',
          html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #114373 0%, #0d3559 100%); padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0;">
                <div style="background: rgba(255,255,255,0.1); border-radius: 50%; width: 80px; height: 80px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                  <span style="color: white; font-size: 32px; font-weight: bold;">🔐</span>
                </div>
                <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">Email Verification</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px;">Secure your account with us</p>
              </div>

              <!-- Main Content -->
              <div style="padding: 40px 30px; background: #f8fafc;">
                <div style="text-align: center; margin-bottom: 30px;">
                  <h2 style="color: #1e293b; margin: 0 0 10px; font-size: 24px; font-weight: 600;">Hello ${data.name}!</h2>
                  <p style="color: #64748b; margin: 0; font-size: 16px; line-height: 1.5;">
                    Thank you for registering with Axia HR Advisory. To complete your registration and secure your account, please verify your email address using the code below.
                  </p>
                </div>

                <!-- OTP Code Box -->
                <div style="background: white; border: 2px solid #e2e8f0; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                  <p style="color: #64748b; margin: 0 0 15px; font-size: 14px; font-weight: 500;">Your verification code:</p>
                  <div style="background: linear-gradient(135deg, #114373, #0d3559); color: white; font-size: 32px; font-weight: bold; letter-spacing: 8px; padding: 20px; border-radius: 8px; margin: 15px 0; font-family: 'Courier New', monospace;">
                    ${data.otp}
                  </div>
                  <p style="color: #ef4444; margin: 15px 0 0; font-size: 14px; font-weight: 500;">
                    ⏰ This code expires in ${data.expiryMinutes || 10} minutes
                  </p>
                </div>

                <!-- Instructions -->
                <div style="background: #f1f5f9; border-radius: 8px; padding: 20px; margin: 20px 0;">
                  <h3 style="color: #1e293b; margin: 0 0 15px; font-size: 16px; font-weight: 600;">What to do next:</h3>
                  <ol style="color: #64748b; margin: 0; padding-left: 20px; line-height: 1.6;">
                    <li>Copy the verification code above</li>
                    <li>Return to the registration page</li>
                    <li>Enter the code in the verification field</li>
                    <li>Complete your account setup</li>
                  </ol>
                </div>

                <!-- Security Notice -->
                <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0;">
                  <p style="color: #92400e; margin: 0; font-size: 14px; line-height: 1.5;">
                    <strong>🔒 Security Notice:</strong> Never share this code with anyone. Axia HR will never ask for your verification code via phone or email.
                  </p>
                </div>

                <p style="color: #64748b; margin: 30px 0 0; font-size: 14px; line-height: 1.6;">
                  If you didn't request this verification, please ignore this email or contact our support team.
                </p>
              </div>

              <!-- Footer -->
              <div style="background: #1e293b; color: white; padding: 30px; text-align: center; border-radius: 0 0 12px 12px;">
                <p style="margin: 0 0 10px; font-size: 14px; font-weight: 500;">Best regards,<br>The Axia HR Team</p>
                <p style="margin: 0; font-size: 12px; color: #94a3b8;">© 2024 Axia HR Advisory. All rights reserved.</p>
              </div>
            </div>
          `,
        };
        break;

      case 'welcome-candidate':
        if (!data?.name || !data?.loginUrl) {
          return NextResponse.json(
            { error: 'Missing required data for welcome candidate email' },
            { status: 400 }
          );
        }
        emailOptions = {
          to,
          subject: '🎉 Welcome to Axia HR - Your Career Journey Starts Here!',
          html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #114373 0%, #0d3559 100%); padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0; position: relative; overflow: hidden;">
                <div style="position: absolute; top: -50px; right: -50px; width: 100px; height: 100px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
                <div style="position: absolute; bottom: -30px; left: -30px; width: 60px; height: 60px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
                <div style="background: rgba(255,255,255,0.1); border-radius: 50%; width: 80px; height: 80px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; position: relative; z-index: 1;">
                  <span style="color: white; font-size: 32px;">🚀</span>
                </div>
                <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600; position: relative; z-index: 1;">Welcome to Axia HR!</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px; position: relative; z-index: 1;">Your career journey starts here</p>
              </div>

              <!-- Main Content -->
              <div style="padding: 40px 30px; background: #f8fafc;">
                <div style="text-align: center; margin-bottom: 30px;">
                  <h2 style="color: #1e293b; margin: 0 0 10px; font-size: 24px; font-weight: 600;">Hello ${data.name}! 👋</h2>
                  <p style="color: #64748b; margin: 0; font-size: 16px; line-height: 1.5;">
                    Congratulations! Your account has been successfully created and you're now part of Tanzania's premier talent network. We're excited to help you advance your career!
                  </p>
                </div>

                <!-- Features Grid -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 30px 0;">
                  <div style="background: white; border-radius: 12px; padding: 20px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <div style="font-size: 24px; margin-bottom: 10px;">💼</div>
                    <h3 style="color: #114373; margin: 0 0 8px; font-size: 16px; font-weight: 600;">Find Jobs</h3>
                    <p style="color: #64748b; margin: 0; font-size: 14px; line-height: 1.4;">Browse opportunities from top companies</p>
                  </div>
                  <div style="background: white; border-radius: 12px; padding: 20px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <div style="font-size: 24px; margin-bottom: 10px;">📈</div>
                    <h3 style="color: #114373; margin: 0 0 8px; font-size: 16px; font-weight: 600;">Build Profile</h3>
                    <p style="color: #64748b; margin: 0; font-size: 14px; line-height: 1.4;">Showcase your skills and experience</p>
                  </div>
                  <div style="background: white; border-radius: 12px; padding: 20px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <div style="font-size: 24px; margin-bottom: 10px;">🤝</div>
                    <h3 style="color: #114373; margin: 0 0 8px; font-size: 16px; font-weight: 600;">Connect</h3>
                    <p style="color: #64748b; margin: 0; font-size: 14px; line-height: 1.4;">Network with industry professionals</p>
                  </div>
                  <div style="background: white; border-radius: 12px; padding: 20px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <div style="font-size: 24px; margin-bottom: 10px;">🎯</div>
                    <h3 style="color: #114373; margin: 0 0 8px; font-size: 16px; font-weight: 600;">Grow</h3>
                    <p style="color: #64748b; margin: 0; font-size: 14px; line-height: 1.4;">Access career development resources</p>
                  </div>
                </div>

                <!-- CTA Button -->
                <div style="text-align: center; margin: 40px 0;">
                  <a href="${data.loginUrl}" style="background: linear-gradient(135deg, #114373, #0d3559); color: white; padding: 16px 32px; text-decoration: none; border-radius: 50px; display: inline-block; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(17, 67, 115, 0.3); transition: all 0.3s ease;">
                    🚀 Get Started Now
                  </a>
                </div>

                <!-- Stats -->
                <div style="background: linear-gradient(135deg, #114373, #0d3559); color: white; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0;">
                  <h3 style="margin: 0 0 20px; font-size: 18px; font-weight: 600;">Join Our Success Stories</h3>
                  <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px;">
                    <div>
                      <div style="font-size: 24px; font-weight: bold; margin-bottom: 5px;">500+</div>
                      <div style="font-size: 12px; opacity: 0.9;">Happy Candidates</div>
                    </div>
                    <div>
                      <div style="font-size: 24px; font-weight: bold; margin-bottom: 5px;">98%</div>
                      <div style="font-size: 12px; opacity: 0.9;">Success Rate</div>
                    </div>
                    <div>
                      <div style="font-size: 24px; font-weight: bold; margin-bottom: 5px;">50+</div>
                      <div style="font-size: 12px; opacity: 0.9;">Industries</div>
                    </div>
                  </div>
                </div>

                <!-- Next Steps -->
                <div style="background: #f1f5f9; border-radius: 12px; padding: 25px; margin: 30px 0;">
                  <h3 style="color: #1e293b; margin: 0 0 15px; font-size: 18px; font-weight: 600;">🎯 Your Next Steps:</h3>
                  <ol style="color: #64748b; margin: 0; padding-left: 20px; line-height: 1.6;">
                    <li><strong>Complete your profile</strong> - Add your skills, experience, and career goals</li>
                    <li><strong>Upload your CV</strong> - Make it easy for employers to find you</li>
                    <li><strong>Set job alerts</strong> - Get notified about relevant opportunities</li>
                    <li><strong>Browse jobs</strong> - Explore our curated job listings</li>
                    <li><strong>Apply with confidence</strong> - Our team is here to support you</li>
                  </ol>
                </div>

                <p style="color: #64748b; margin: 30px 0 0; font-size: 14px; line-height: 1.6;">
                  If you have any questions or need assistance, our support team is here to help you succeed.
                </p>
              </div>

              <!-- Footer -->
              <div style="background: #1e293b; color: white; padding: 30px; text-align: center; border-radius: 0 0 12px 12px;">
                <p style="margin: 0 0 10px; font-size: 14px; font-weight: 500;">Welcome to the Axia HR family!<br>Best regards, The Axia HR Team</p>
                <p style="margin: 0; font-size: 12px; color: #94a3b8;">© 2024 Axia HR Advisory. All rights reserved.</p>
              </div>
            </div>
          `,
        };
        break;

      default:
        // Custom email
        emailOptions = {
          to,
          subject,
          text,
          html,
        };
        break;
    }

    const success = await sendEmail(emailOptions);

    if (success) {
      return NextResponse.json(
        { message: 'Email sent successfully' },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in send-email API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Test email connection endpoint
export async function GET() {
  try {
    const isConnected = await testEmailConnection();
    
    if (isConnected) {
      return NextResponse.json(
        { message: 'Email connection successful' },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { error: 'Email connection failed' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error testing email connection:', error);
    return NextResponse.json(
      { error: 'Failed to test email connection' },
      { status: 500 }
    );
  }
}
