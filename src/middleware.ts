import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyTokenEdge } from './lib/auth-edge';

/* -------------------------------------------
   CONFIGURATION
-------------------------------------------- */
const ADMIN_IP_WHITELIST = process.env.ADMIN_IP_WHITELIST
  ? process.env.ADMIN_IP_WHITELIST.split(',').map(v => v.trim())
  : [];


/* -------------------------------------------
   HELPERS
-------------------------------------------- */
function getClientIP(req: NextRequest): string | null {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    req.headers.get('cf-connecting-ip') ||
    null
  );
}

function isMaintenanceMode(): boolean {
  return process.env.MAINTENANCE_MODE === 'true' || process.env.MAINTENANCE_MODE === '1';
}


/* -------------------------------------------
   MAIN MIDDLEWARE
-------------------------------------------- */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get('host') || '';
  const isAdminSubdomain = hostname.includes('administrator.axia.co.tz');

  /* ----------------------------------------------------------
     1. MAINTENANCE MODE (FAST & CLEAN)
  ----------------------------------------------------------- */
  if (
    isMaintenanceMode() &&
    !isAdminSubdomain &&
    !pathname.startsWith('/admin') &&
    pathname !== '/maintenance' &&
    !pathname.startsWith('/api/')
  ) {
    const token =
      request.cookies.get('administratorAuthToken')?.value ||
      request.headers.get('authorization')?.replace('Bearer ', '');

    if (token) {
      try {
        const decoded = await verifyTokenEdge(token);
        if (decoded.type === 'admin') return NextResponse.next(); // admin allowed during maintenance
      } catch {}
    }

    return NextResponse.redirect(new URL('/maintenance', request.url));
  }

  /* ----------------------------------------------------------
     2. ADMINISTRATOR SUBDOMAIN HANDLING
  ----------------------------------------------------------- */
  if (isAdminSubdomain) {
    if (pathname === '/login') {
      const url = request.nextUrl.clone();
      url.pathname = '/administrator/login';
      return NextResponse.rewrite(url);
    }

    if (pathname === '/') {
      const token = request.cookies.get('administratorAuthToken')?.value || '';
      if (!token) {
        return NextResponse.redirect(new URL('/login', request.url));
      }

      try {
        const decoded = await verifyTokenEdge(token.trim());
        if (decoded.type === 'admin') {
          const url = request.nextUrl.clone();
          url.pathname = '/administrator';
          return NextResponse.rewrite(url);
        }
      } catch {}

      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  /* ----------------------------------------------------------
     3. PROTECT /administrator ROUTES
  ----------------------------------------------------------- */
  if (pathname.startsWith('/administrator') && pathname !== '/administrator/login') {
    const token =
      request.cookies.get('administratorAuthToken')?.value ||
      request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.redirect(new URL('/administrator/login', request.url));
    }

    try {
      const decoded = await verifyTokenEdge(token.trim());
      if (decoded.type !== 'admin') throw new Error('invalid');
      return NextResponse.next();
    } catch {
      const res = NextResponse.redirect(new URL('/administrator/login', request.url));
      res.cookies.delete('administratorAuthToken');
      return res;
    }
  }

  /* ----------------------------------------------------------
     4. PROTECT /admin ROUTES
  ----------------------------------------------------------- */
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    if (ADMIN_IP_WHITELIST.length > 0) {
      const clientIP = getClientIP(request);
      if (clientIP && !ADMIN_IP_WHITELIST.includes(clientIP)) {
        return NextResponse.json(
          { error: 'IP not authorized' },
          { status: 403 }
        );
      }
    }

    const token =
      request.cookies.get('adminAuthToken')?.value ||
      request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    try {
      const decoded = await verifyTokenEdge(token.trim());
      if (decoded.type !== 'admin') throw new Error('invalid');
      return NextResponse.next();
    } catch {
      const res = NextResponse.redirect(new URL('/admin/login', request.url));
      res.cookies.delete('adminAuthToken');
      return res;
    }
  }

  /* ----------------------------------------------------------
     5. SECURITY HEADERS (GLOBAL)
  ----------------------------------------------------------- */
  const response = NextResponse.next();
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  if (pathname.startsWith('/admin')) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }

  return response;
}


/* ----------------------------------------------------------
   MATCHER
----------------------------------------------------------- */
export const config = {
  matcher: [
    '/',
    '/login',
    '/maintenance',
    '/administrator/:path*',
    '/admin/:path*',
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
