import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface ApiHealth {
  endpoint: string;
  status: 'ok' | 'warning' | 'critical' | 'unknown';
  responseTime: number;
  statusCode?: number;
  error?: string;
}

async function checkApiEndpoint(endpoint: string, baseUrl: string): Promise<ApiHealth> {
  const startTime = Date.now();
  try {
    const url = `${baseUrl}${endpoint}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });
    
    const responseTime = Date.now() - startTime;
    const statusCode = response.status;
    
    let status: 'ok' | 'warning' | 'critical' = 'ok';
    if (!response.ok) {
      status = statusCode >= 500 ? 'critical' : 'warning';
    } else if (responseTime > 2000) {
      status = 'warning';
    } else if (responseTime > 5000) {
      status = 'critical';
    }

    return {
      endpoint,
      status,
      responseTime,
      statusCode,
      error: !response.ok ? `HTTP ${statusCode}` : undefined
    };
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    return {
      endpoint,
      status: 'critical',
      responseTime,
      error: error.message || 'Request failed'
    };
  }
}

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

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://axia.co.tz';
    
    // Check ping (server availability)
    let pingStatus = 'unknown';
    let pingResponseTime = 0;
    try {
      const startTime = Date.now();
      await execAsync('ping -c 1 8.8.8.8 2>/dev/null || echo "ping failed"');
      pingResponseTime = Date.now() - startTime;
      pingStatus = 'ok';
    } catch {
      pingStatus = 'critical';
    }

    // Check HTTPS certificate
    let httpsStatus = 'unknown';
    let httpsExpires: Date | null = null;
    try {
      const { stdout } = await execAsync(`echo | openssl s_client -servername axia.co.tz -connect axia.co.tz:443 2>/dev/null | openssl x509 -noout -dates 2>/dev/null | grep notAfter | cut -d= -f2 || echo ""`);
      if (stdout.trim()) {
        httpsExpires = new Date(stdout.trim());
        const daysUntilExpiry = (httpsExpires.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
        httpsStatus = daysUntilExpiry > 30 ? 'ok' : daysUntilExpiry > 7 ? 'warning' : 'critical';
      }
    } catch {
      // Certificate check failed
    }

    // Check critical Axia system APIs
    const apiEndpoints = [
      '/api/health',
      '/api/jobs',
      '/api/candidates/login',
      '/api/employers/login',
      '/api/admin/login',
      '/api/applications',
      '/api/interviews',
      '/api/invoices',
      '/api/payments',
    ];

    const apiHealthChecks = await Promise.all(
      apiEndpoints.map(endpoint => checkApiEndpoint(endpoint, baseUrl))
    );

    // Overall API status
    const criticalApis = apiHealthChecks.filter(api => api.status === 'critical').length;
    const warningApis = apiHealthChecks.filter(api => api.status === 'warning').length;
    let overallApiStatus: 'ok' | 'warning' | 'critical' = 'ok';
    if (criticalApis > 0) {
      overallApiStatus = 'critical';
    } else if (warningApis > 0) {
      overallApiStatus = 'warning';
    }

    const avgResponseTime = apiHealthChecks.reduce((sum, api) => sum + api.responseTime, 0) / apiHealthChecks.length;

    return NextResponse.json({
      ping: { status: pingStatus, responseTime: pingResponseTime },
      https: { status: httpsStatus, expires: httpsExpires },
      api: { status: overallApiStatus, responseTime: Math.round(avgResponseTime) },
      apiHealth: apiHealthChecks
    });
  } catch (error: any) {
    console.error('Error fetching health status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch health status', details: error.message },
      { status: 500 }
    );
  }
}

