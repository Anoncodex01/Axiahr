import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { createReadStream, stat } from 'fs';
import { join } from 'path';
import { promisify } from 'util';

const statAsync = promisify(stat);

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

    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');

    if (!filename) {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
    }

    const backupDir = '/var/backups/axia-nextjs';
    const filePath = join(backupDir, filename);

    // Security check: ensure file is in backup directory
    if (!filePath.startsWith(backupDir)) {
      return NextResponse.json({ error: 'Invalid file path' }, { status: 400 });
    }

    // Check if file exists
    try {
      const stats = await statAsync(filePath);
      if (!stats.isFile()) {
        return NextResponse.json({ error: 'File not found' }, { status: 404 });
      }
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return NextResponse.json({ error: 'File not found' }, { status: 404 });
      }
      throw error;
    }

    // Stream the file
    const fileStream = createReadStream(filePath);
    const headers = new Headers();
    headers.set('Content-Type', 'application/octet-stream');
    headers.set('Content-Disposition', `attachment; filename="${filename}"`);

    return new NextResponse(fileStream as any, { headers });
  } catch (error: any) {
    console.error('Error downloading backup:', error);
    return NextResponse.json(
      { error: 'Failed to download backup', details: error.message },
      { status: 500 }
    );
  }
}

