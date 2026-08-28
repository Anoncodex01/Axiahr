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
        { error: 'Deployment is only available on Linux servers' },
        { status: 400 }
      );
    }

    const appDir = '/var/www/axia-nextjs';
    const output: string[] = [];

    try {
      output.push('📦 Starting deployment process...');
      
      // Step 1: Pull latest changes
      output.push('🔄 Pulling latest changes from GitHub...');
      const { stdout: pullOutput } = await execAsync('git pull origin main', { 
        cwd: appDir,
        timeout: 60000 // 60 seconds
      });
      output.push(...pullOutput.split('\n').filter(Boolean));

      // Step 2: Install dependencies (if package.json changed)
      output.push('📥 Installing dependencies...');
      try {
        const { stdout: npmOutput } = await execAsync('npm install', { 
          cwd: appDir,
          timeout: 300000 // 5 minutes
        });
        output.push(...npmOutput.split('\n').slice(-10)); // Last 10 lines
      } catch (npmError: any) {
        output.push(`⚠️ npm install warning: ${npmError.message}`);
      }

      // Step 3: Build the application
      output.push('🔨 Building application...');
      const { stdout: buildOutput } = await execAsync('npm run build', { 
        cwd: appDir,
        timeout: 600000 // 10 minutes
      });
      output.push(...buildOutput.split('\n').slice(-20)); // Last 20 lines

      // Step 4: Restart PM2
      output.push('🔄 Restarting application...');
      const { stdout: restartOutput } = await execAsync('pm2 restart axia-nextjs', { 
        cwd: appDir,
        timeout: 30000 // 30 seconds
      });
      output.push(...restartOutput.split('\n').filter(Boolean));

      output.push('✅ Deployment completed successfully!');

      return NextResponse.json({
        success: true,
        message: 'Deployment completed successfully',
        output
      });
    } catch (error: any) {
      output.push(`❌ Error: ${error.message}`);
      if (error.stdout) {
        output.push(...error.stdout.split('\n').slice(-20));
      }
      if (error.stderr) {
        output.push(...error.stderr.split('\n').slice(-20));
      }

      return NextResponse.json({
        success: false,
        error: error.message || 'Deployment failed',
        output
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error in deployment pull API:', error);
    return NextResponse.json(
      { error: 'Failed to pull and deploy', details: error.message },
      { status: 500 }
    );
  }
}

