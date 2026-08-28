import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { verifyToken } from '@/lib/auth';

const execAsync = promisify(exec);

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

    const platform = process.platform;
    if (platform !== 'linux') {
      return NextResponse.json({
        processes: [],
        message: 'PM2 monitoring is only available on Linux servers'
      });
    }

    try {
      const { stdout } = await execAsync('pm2 jlist');
      const processes = JSON.parse(stdout);
      
      return NextResponse.json({
        processes: processes.map((proc: any) => ({
          name: proc.name,
          status: proc.pm2_env?.status || 'unknown',
          cpu: proc.monit?.cpu || 0,
          memory: proc.monit?.memory ? `${(proc.monit.memory / 1024 / 1024).toFixed(2)} MB` : '0 MB',
          uptime: proc.pm2_env?.pm_uptime || 0,
          restarts: proc.pm2_env?.restart_time || 0,
        }))
      });
    } catch (error: any) {
      return NextResponse.json({
        processes: [],
        error: 'PM2 not available or not running'
      });
    }
  } catch (error: any) {
    console.error('Error fetching PM2 status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch PM2 status', details: error.message },
      { status: 500 }
    );
  }
}

