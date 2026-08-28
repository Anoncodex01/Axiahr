import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  from?: string;
  attachments?: Array<{
    filename: string;
    path?: string;
    content?: Buffer | string;
    contentType?: string;
  }>;
}

// Create transporter
const createTransporter = () => {
  const host = process.env.SMTP_HOST!;
  const port = parseInt(process.env.SMTP_PORT!);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  const user = process.env.SMTP_USER!;
  const pass = process.env.SMTP_PASS!;

  if (!host || !user || !pass) {
    throw new Error('SMTP configuration incomplete. Please check your .env file.');
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    requireTLS: !secure && port === 587,
    tls: { rejectUnauthorized: false },
    connectionTimeout: parseInt(process.env.SMTP_CONNECTION_TIMEOUT || '60000'),
    greetingTimeout: parseInt(process.env.SMTP_GREETING_TIMEOUT || '30000'),
    socketTimeout: parseInt(process.env.SMTP_SOCKET_TIMEOUT || '120000'),
  });
};

// Send email
export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  const transporter = createTransporter();
  const fromName = process.env.FROM_NAME || 'Axia HR Advisory';
  const fromEmail = options.from || process.env.FROM_EMAIL || process.env.SMTP_USER!;

  try {
    const result = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      attachments: options.attachments,
      envelope: { from: fromEmail, to: Array.isArray(options.to) ? options.to : [options.to] },
      headers: { 'X-Mailer': 'Axia HR Advisory', 'Reply-To': fromEmail },
    });

    transporter.close();

    if (result.rejected && result.rejected.length > 0) {
      throw new Error(`Email rejected for: ${result.rejected.join(', ')}`);
    }
    return true;
  } catch (err) {
    transporter.close();
    throw err;
  }
};

// Test SMTP connection
export const testEmailConnection = async (): Promise<boolean> => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    return true;
  } catch (err) {
    console.error('SMTP Connection Error:', err);
    return false;
  }
};
