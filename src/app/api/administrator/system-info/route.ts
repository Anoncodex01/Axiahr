import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('administratorAuthToken')?.value ||
                  request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (decoded.type !== 'admin' || decoded.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({
      nodeVersion: process.version,
      nextVersion: process.env.npm_package_dependencies_next || 'Unknown',
      platform: process.platform,
      arch: process.arch,
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      database: {
        host: process.env.DB_HOST || 'Not configured',
        name: process.env.DB_NAME || 'Not configured',
        user: process.env.DB_USER || 'Not configured'
      },
      appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    });
  } catch (error: any) {
    console.error('Error fetching system info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch system info', details: error.message },
      { status: 500 }
    );
  }
}

