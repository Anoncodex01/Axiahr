import { NextRequest } from 'next/server';
import { verifyToken } from './auth';
import { cookies } from 'next/headers';

/**
 * Verify admin authentication from request
 * Use this in API routes and server components
 */
export async function verifyAdminAuth(request?: NextRequest): Promise<{
  authenticated: boolean;
  user?: {
    id: string;
    email: string;
    role: string;
    permissions: string[];
  };
  error?: string;
}> {
  try {
    let token: string | undefined;
    
    if (request) {
      // Get token from request (API route)
      token = 
        request.cookies.get('adminAuthToken')?.value ||
        request.cookies.get('axia_admin_token')?.value ||
        request.headers.get('authorization')?.replace('Bearer ', '');
    } else {
      // Get token from cookies (Server Component)
      const cookieStore = await cookies();
      token = 
        cookieStore.get('adminAuthToken')?.value ||
        cookieStore.get('axia_admin_token')?.value;
    }
    
    if (!token) {
      return { authenticated: false, error: 'No authentication token found' };
    }
    
    // Verify token
    const decoded = verifyToken(token);
    
    // Check if token is for admin
    if (decoded.type !== 'admin') {
      return { authenticated: false, error: 'Invalid token type' };
    }
    
    return {
      authenticated: true,
      user: {
        id: decoded.sub || '',
        email: decoded.email || '',
        role: decoded.role || '',
        permissions: decoded.permissions || [],
      },
    };
  } catch (error) {
    return { authenticated: false, error: 'Invalid or expired token' };
  }
}

/**
 * Require admin authentication - throws error if not authenticated
 * Use this in API routes that require admin access
 */
export async function requireAdminAuth(request: NextRequest) {
  const auth = await verifyAdminAuth(request);
  
  if (!auth.authenticated || !auth.user) {
    throw new Error(auth.error || 'Unauthorized');
  }
  
  return auth.user;
}

