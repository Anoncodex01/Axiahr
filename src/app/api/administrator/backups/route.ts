import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { verifyToken } from '@/lib/auth';
import { readdir, stat } from 'fs/promises';
import { join } from 'path';
import { createReadStream } from 'fs';

const execAsync = promisify(exec);

// GET - List all backups
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
        backups: [],
        message: 'Backup management is only available on Linux servers'
      });
    }

    const backups: any[] = [];
    const backupDir = '/var/backups/axia-nextjs';

    try {
      // Check if backup directory exists
      const files = await readdir(backupDir);
      
      for (const file of files) {
        if (file.endsWith('.sql') || file.endsWith('.tar.gz') || file.endsWith('.zip')) {
          const filePath = join(backupDir, file);
          const stats = await stat(filePath);
          
          let type: 'database' | 'full' | 'application' = 'database';
          if (file.endsWith('.tar.gz')) type = 'full';
          else if (file.endsWith('.zip')) type = 'application';

          backups.push({
            filename: file,
            size: stats.size,
            created: stats.birthtime.toISOString(),
            type
          });
        }
      }

      // Sort by creation date (newest first)
      backups.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
    } catch (error: any) {
      // Backup directory might not exist yet
      if (error.code !== 'ENOENT') {
        console.error('Error reading backup directory:', error);
      }
    }

    return NextResponse.json({
      backups,
      backupCount: backups.length
    });
  } catch (error: any) {
    console.error('Error fetching backups:', error);
    return NextResponse.json(
      { error: 'Failed to fetch backups', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Create a new backup
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

    const body = await request.json();
    const { type = 'database' } = body;

    const platform = process.platform;
    if (platform !== 'linux') {
      return NextResponse.json(
        { error: 'Backup management is only available on Linux servers' },
        { status: 400 }
      );
    }

    const backupDir = '/var/backups/axia-nextjs';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    let command = '';

    // Ensure backup directory exists
    await execAsync(`mkdir -p ${backupDir}`);

    switch (type) {
      case 'database':
        const dbHost = process.env.DB_HOST || 'localhost';
        const dbUser = process.env.DB_USER || 'root';
        const dbPassword = process.env.DB_PASSWORD || '';
        const dbName = process.env.DB_NAME || 'axia';
        const filename = `database-${timestamp}.sql`;
        command = `mysqldump -h ${dbHost} -u ${dbUser} -p'${dbPassword}' ${dbName} > ${backupDir}/${filename}`;
        break;
      case 'full':
        const fullFilename = `full-vps-${timestamp}.tar.gz`;
        command = `tar -czf ${backupDir}/${fullFilename} /var/www/axia-nextjs /etc/nginx /etc/letsencrypt 2>/dev/null || echo "Backup created with warnings"`;
        break;
      case 'application':
        const appFilename = `application-${timestamp}.zip`;
        command = `cd /var/www && zip -r ${backupDir}/${appFilename} axia-nextjs -x "axia-nextjs/.next/*" "axia-nextjs/node_modules/*" "axia-nextjs/.git/*"`;
        break;
      default:
        return NextResponse.json({ error: 'Invalid backup type' }, { status: 400 });
    }

    // Run backup in background
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error('Backup error:', error);
      }
    });

    return NextResponse.json({
      success: true,
      message: `${type} backup started. It will be available shortly.`,
      backupId: timestamp
    });
  } catch (error: any) {
    console.error('Error creating backup:', error);
    return NextResponse.json(
      { error: 'Failed to create backup', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete a backup
export async function DELETE(request: NextRequest) {
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

    const body = await request.json();
    const { filename } = body;

    if (!filename) {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
    }

    const backupDir = '/var/backups/axia-nextjs';
    const filePath = join(backupDir, filename);

    // Security check: ensure file is in backup directory
    if (!filePath.startsWith(backupDir)) {
      return NextResponse.json({ error: 'Invalid file path' }, { status: 400 });
    }

    await execAsync(`rm -f "${filePath}"`);

    return NextResponse.json({
      success: true,
      message: 'Backup deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting backup:', error);
    return NextResponse.json(
      { error: 'Failed to delete backup', details: error.message },
      { status: 500 }
    );
  }
}

