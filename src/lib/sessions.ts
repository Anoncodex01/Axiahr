import { executeQuery, executeSingleQuery } from './database';
import crypto from 'crypto';

export interface Session {
  id: string;
  user_id: number;
  token: string;
  expires_at: Date;
  created_at: Date;
  last_activity: Date;
  ip_address?: string;
  user_agent?: string;
}

/**
 * Create a new session in the database
 */
export async function createSession(
  userId: number,
  token: string,
  expiresInDays: number = 7,
  ipAddress?: string,
  userAgent?: string
): Promise<Session> {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);

  const sessionId = crypto.randomBytes(32).toString('hex');

  await executeSingleQuery(
    `INSERT INTO sessions (id, user_id, token, expires_at, ip_address, user_agent, created_at, last_activity)
     VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [sessionId, userId, token, expiresAt, ipAddress || null, userAgent || null]
  );

  return {
    id: sessionId,
    user_id: userId,
    token,
    expires_at: expiresAt,
    created_at: new Date(),
    last_activity: new Date(),
    ip_address: ipAddress,
    user_agent: userAgent
  };
}

/**
 * Get session by token
 */
export async function getSessionByToken(token: string): Promise<Session | null> {
  try {
    const sessions = await executeQuery<Session>(
      `SELECT id, user_id, token, expires_at, created_at, last_activity, ip_address, user_agent
       FROM sessions
       WHERE token = ? AND expires_at > NOW()`,
      [token]
    );

    if (sessions.length === 0) {
      return null;
    }

    // Update last activity
    await executeSingleQuery(
      'UPDATE sessions SET last_activity = NOW() WHERE id = ?',
      [sessions[0].id]
    );

    return sessions[0];
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

/**
 * Delete session by token
 */
export async function deleteSession(token: string): Promise<boolean> {
  try {
    await executeSingleQuery(
      'DELETE FROM sessions WHERE token = ?',
      [token]
    );
    return true;
  } catch (error) {
    console.error('Error deleting session:', error);
    return false;
  }
}

/**
 * Delete all sessions for a user
 */
export async function deleteAllUserSessions(userId: number): Promise<boolean> {
  try {
    await executeSingleQuery(
      'DELETE FROM sessions WHERE user_id = ?',
      [userId]
    );
    return true;
  } catch (error) {
    console.error('Error deleting user sessions:', error);
    return false;
  }
}

/**
 * Clean up expired sessions
 */
export async function cleanupExpiredSessions(): Promise<number> {
  try {
    const result = await executeSingleQuery(
      'DELETE FROM sessions WHERE expires_at < NOW()'
    );
    return result.affectedRows || 0;
  } catch (error) {
    console.error('Error cleaning up expired sessions:', error);
    return 0;
  }
}

