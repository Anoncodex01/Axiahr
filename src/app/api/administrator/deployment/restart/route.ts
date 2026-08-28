import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
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
      return NextResponse.json(
        { error: 'Application restart is only available on Linux servers' },
        { status: 400 }
      );
    }

    const output: string[] = [];

    try {
      output.push('🔄 Restarting application...');
      
      const { stdout: restartOutput } = await execAsync('pm2 restart axia-nextjs', {
        timeout: 30000 // 30 seconds
      });
      
      output.push(...restartOutput.split('\n').filter(Boolean));
      output.push('✅ Application restarted successfully!');

      return NextResponse.json({
        success: true,
        message: 'Application restarted successfully',
        output
      });
    } catch (error: any) {
      output.push(`❌ Error: ${error.message}`);
      if (error.stdout) {
        output.push(...error.stdout.split('\n'));
      }
      if (error.stderr) {
        output.push(...error.stderr.split('\n'));
      }

      return NextResponse.json({
        success: false,
        error: error.message || 'Restart failed',
        output
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error in deployment restart API:', error);
    return NextResponse.json(
      { error: 'Failed to restart application', details: error.message },
      { status: 500 }
    );
  }
}

