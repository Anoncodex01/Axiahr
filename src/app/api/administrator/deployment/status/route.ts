import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { exec } from 'child_process';
import { promisify } from 'util';

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
        branch: 'main',
        status: 'unknown',
        lastCommit: 'N/A (not on Linux server)',
        lastPull: null,
        hasChanges: false,
        ahead: 0,
        behind: 0
      });
    }

    const appDir = '/var/www/axia-nextjs';
    const output: string[] = [];

    try {
      // Get current branch
      const { stdout: branch } = await execAsync('git rev-parse --abbrev-ref HEAD', { cwd: appDir });
      
      // Get last commit
      const { stdout: lastCommit } = await execAsync('git log -1 --pretty=format:"%h - %s (%ar)"', { cwd: appDir });
      
      // Check if there are uncommitted changes
      const { stdout: status } = await execAsync('git status --porcelain', { cwd: appDir });
      const hasChanges = status.trim().length > 0;
      
      // Check if behind/ahead of remote
      await execAsync('git fetch origin', { cwd: appDir }).catch(() => {});
      const { stdout: aheadBehind } = await execAsync('git rev-list --left-right --count origin/main...HEAD', { cwd: appDir }).catch(() => ({ stdout: '0\t0' }));
      const [ahead, behind] = aheadBehind.trim().split('\t').map(Number);

      return NextResponse.json({
        branch: branch.trim(),
        status: hasChanges ? 'dirty' : 'clean',
        lastCommit: lastCommit.trim(),
        lastPull: null, // Could be stored in a file
        hasChanges,
        ahead: ahead || 0,
        behind: behind || 0
      });
    } catch (error: any) {
      console.error('Error getting git status:', error);
      return NextResponse.json({
        branch: 'unknown',
        status: 'error',
        lastCommit: 'Error fetching',
        lastPull: null,
        hasChanges: false,
        ahead: 0,
        behind: 0
      });
    }
  } catch (error: any) {
    console.error('Error in deployment status API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch deployment status', details: error.message },
      { status: 500 }
    );
  }
}

