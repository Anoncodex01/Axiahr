import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

// POST - Run backup manually
export async function POST(request: NextRequest) {
  try {
    const backupScript = '/var/www/axia-nextjs/scripts/sync-database-backup.sh';
    
    // Check if script exists
    try {
      await fs.access(backupScript);
    } catch {
      return NextResponse.json(
        { error: 'Backup script not found on server' },
        { status: 404 }
      );
    }

    // Execute backup script
    const { stdout, stderr } = await execAsync(
      `bash ${backupScript}`,
      {
        cwd: '/var/www/axia-nextjs',
        timeout: 600000 // 10 minutes timeout
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Backup completed successfully',
      output: stdout,
      error: stderr || null
    });

  } catch (error: any) {
    console.error('Backup execution error:', error);
    return NextResponse.json(
      { 
        error: 'Backup failed', 
        details: error?.message,
        output: error.stdout || '',
        stderr: error.stderr || ''
      },
      { status: 500 }
    );
  }
}

// GET - Get backup status and history
export async function GET(request: NextRequest) {
  try {
    const backupDir = '/var/backups/axia-db';
    const logDir = '/var/log/axia-db';

    // List backup files
    let backups: any[] = [];
    try {
      const files = await fs.readdir(backupDir);
      const backupFiles = files.filter(f => f.endsWith('.sql.gz'));
      
      for (const file of backupFiles) {
        const filePath = path.join(backupDir, file);
        const stats = await fs.stat(filePath);
        backups.push({
          filename: file,
          size: stats.size,
          created: stats.birthtime || stats.mtime,
          path: filePath
        });
      }
      
      // Sort by creation date (newest first)
      backups.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
    } catch (error) {
      console.error('Error reading backup directory:', error);
    }

    // Get latest backup log
    let latestLog = '';
    try {
      const logFiles = await fs.readdir(logDir);
      const backupLogs = logFiles.filter(f => f.startsWith('backup-') && f.endsWith('.log'));
      if (backupLogs.length > 0) {
        backupLogs.sort().reverse();
        const latestLogFile = path.join(logDir, backupLogs[0]);
        latestLog = await fs.readFile(latestLogFile, 'utf-8');
      }
    } catch (error) {
      console.error('Error reading log directory:', error);
    }

    // Get cron log
    let cronLog = '';
    try {
      const cronLogPath = path.join(logDir, 'cron-backup.log');
      cronLog = await fs.readFile(cronLogPath, 'utf-8');
    } catch (error) {
      // Cron log might not exist yet
    }

    return NextResponse.json({
      backups,
      latestLog: latestLog.substring(Math.max(0, latestLog.length - 5000)), // Last 5000 chars
      cronLog: cronLog.substring(Math.max(0, cronLog.length - 5000)), // Last 5000 chars
      backupCount: backups.length
    });

  } catch (error: any) {
    console.error('Get backup status error:', error);
    return NextResponse.json(
      { error: 'Failed to get backup status', details: error?.message },
      { status: 500 }
    );
  }
}

