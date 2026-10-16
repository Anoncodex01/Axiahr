import crypto from 'crypto';
import { executeQuery, executeSingleQuery } from '@/lib/database';
import { hashPassword } from '@/lib/auth';
import { sendEmail } from '@/lib/email';

export type PasswordResetUserType = 'employer' | 'candidate';

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function hashResetToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function appBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || 'https://axia.co.tz').replace(/\/$/, '');
}

interface AccountRow {
  id: number;
  email: string;
  name: string;
}

async function findAccount(userType: PasswordResetUserType, email: string): Promise<AccountRow | null> {
  const normalised = email.trim().toLowerCase();

  if (userType === 'employer') {
    const rows = await executeQuery<AccountRow>(
      `SELECT id, email,
              COALESCE(NULLIF(contact_person, ''), NULLIF(company_name, ''), email) AS name
       FROM employers
       WHERE LOWER(email) = ?
       LIMIT 1`,
      [normalised]
    );
    return rows[0] || null;
  }

  const rows = await executeQuery<AccountRow>(
    `SELECT id, email,
            TRIM(CONCAT(COALESCE(first_name, ''), ' ', COALESCE(surname, ''))) AS name
     FROM candidates
     WHERE LOWER(email) = ?
     LIMIT 1`,
    [normalised]
  );
  return rows[0] || null;
}

async function storeResetToken(userType: PasswordResetUserType, userId: number, tokenHash: string, expiresAt: Date) {
  const table = userType === 'employer' ? 'employers' : 'candidates';
  await executeSingleQuery(
    `UPDATE ${table}
     SET password_reset_token = ?, password_reset_expires = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [tokenHash, expiresAt, userId]
  );
}

async function clearResetToken(userType: PasswordResetUserType, userId: number) {
  const table = userType === 'employer' ? 'employers' : 'candidates';
  await executeSingleQuery(
    `UPDATE ${table}
     SET password_reset_token = NULL, password_reset_expires = NULL, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [userId]
  );
}

function resetEmailHtml(name: string, resetUrl: string): string {
  const safeName = name?.trim() || 'there';
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #114373, #0d3559); padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Password Reset</h1>
      </div>
      <div style="padding: 30px; background: #f8f9fa;">
        <h2 style="color: #114373; margin-top: 0;">Hello ${safeName},</h2>
        <p>We received a request to reset your password for your Axia HR Advisory account.</p>
        <p>Click the button below to choose a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background: #114373; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; display: inline-block;">Reset Password</a>
        </div>
        <p><strong>Important:</strong> This link expires in 1 hour for security reasons.</p>
        <p>If you did not request this, you can ignore this email. Your password will stay the same.</p>
        <p style="word-break: break-all; color: #666; font-size: 12px;">Or copy this link:<br>${resetUrl}</p>
        <p>Best regards,<br>The Axia HR Team</p>
      </div>
      <div style="background: #114373; color: white; padding: 20px; text-align: center; font-size: 12px;">
        <p>© ${new Date().getFullYear()} Axia HR Advisory. All rights reserved.</p>
      </div>
    </div>
  `;
}

/**
 * Creates a reset token and emails the link.
 * Always returns a generic success message to the caller (even if the email is unknown),
 * except when sending the email fails after a token was created.
 */
export async function requestPasswordReset(
  userType: PasswordResetUserType,
  email: string
): Promise<{ ok: true; message: string } | { ok: false; error: string; status: number }> {
  const account = await findAccount(userType, email);

  // Generic response — do not reveal whether the email exists
  const genericMessage =
    'If an account exists for that email, we have sent a password reset link. Please check your inbox and spam folder.';

  if (!account) {
    return { ok: true, message: genericMessage };
  }

  const token = generateResetToken();
  const tokenHash = hashResetToken(token);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);
  await storeResetToken(userType, account.id, tokenHash, expiresAt);

  const path =
    userType === 'employer'
      ? `/employer/reset-password?token=${token}`
      : `/candidate/reset-password?token=${token}`;
  const resetUrl = `${appBaseUrl()}${path}`;

  try {
    await sendEmail({
      to: account.email,
      subject: 'Password Reset Request - Axia HR Advisory',
      html: resetEmailHtml(account.name, resetUrl),
      text: `Hello ${account.name},\n\nReset your password: ${resetUrl}\n\nThis link expires in 1 hour.`,
    });
  } catch (error) {
    console.error(`Failed to send ${userType} password reset email:`, error);
    await clearResetToken(userType, account.id);
    return {
      ok: false,
      error:
        'We could not send the reset email right now. Please try again later, or contact support if this continues.',
      status: 503,
    };
  }

  return { ok: true, message: genericMessage };
}

export async function resetPasswordWithToken(
  userType: PasswordResetUserType,
  token: string,
  newPassword: string
): Promise<{ ok: true; message: string } | { ok: false; error: string; status: number }> {
  if (!token || token.length < 32) {
    return { ok: false, error: 'Invalid or expired reset link.', status: 400 };
  }

  if (!newPassword || newPassword.length < 8) {
    return { ok: false, error: 'Password must be at least 8 characters.', status: 400 };
  }

  const tokenHash = hashResetToken(token);
  const table = userType === 'employer' ? 'employers' : 'candidates';

  const rows = await executeQuery<{ id: number }>(
    `SELECT id FROM ${table}
     WHERE password_reset_token = ?
       AND password_reset_expires IS NOT NULL
       AND password_reset_expires > NOW()
     LIMIT 1`,
    [tokenHash]
  );

  const account = rows[0];
  if (!account) {
    return {
      ok: false,
      error: 'This reset link is invalid or has expired. Please request a new one.',
      status: 400,
    };
  }

  const passwordHash = await hashPassword(newPassword);
  await executeSingleQuery(
    `UPDATE ${table}
     SET password_hash = ?,
         password_reset_token = NULL,
         password_reset_expires = NULL,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [passwordHash, account.id]
  );

  return { ok: true, message: 'Your password has been updated. You can now sign in.' };
}
