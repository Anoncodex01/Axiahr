import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';

const execAsync = promisify(exec);

// POST - Switch database
export async function POST(request: NextRequest) {
  try {
    const { target } = await request.json();
    
    if (!target || !['cpanel', 'vps'].includes(target)) {
      return NextResponse.json(
        { error: 'Invalid target. Must be "cpanel" or "vps"' },
        { status: 400 }
      );
    }

    const envFile = '/var/www/axia-nextjs/.env.production';

    const cpanelPassword = process.env.CPANEL_DB_PASSWORD;
    if (target === 'cpanel' && !cpanelPassword) {
      return NextResponse.json(
        { error: 'CPANEL_DB_PASSWORD is not configured on the server' },
        { status: 500 }
      );
    }
    
    // Read current env file
    let envContent = '';
    try {
      envContent = await fs.readFile(envFile, 'utf-8');
    } catch (error) {
      return NextResponse.json(
        { error: 'Environment file not found' },
        { status: 404 }
      );
    }

    // Get VPS backup password
    let vpsPassword = '';
    try {
      const credsFile = '/root/axia-db-backup-credentials.txt';
      const credsContent = await fs.readFile(credsFile, 'utf-8');
      const passwordMatch = credsContent.match(/Database Password:\s*(.+)/);
      if (passwordMatch) {
        vpsPassword = passwordMatch[1].trim();
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'VPS backup credentials not found' },
        { status: 404 }
      );
    }

    // Update environment file
    const lines = envContent.split('\n');
    const updatedLines = lines.map(line => {
      if (target === 'cpanel') {
        if (line.startsWith('DB_HOST=')) return 'DB_HOST=192.250.229.162';
        if (line.startsWith('DB_USER=')) return 'DB_USER=nisapoti_Axia';
        if (line.startsWith('DB_PASSWORD=')) return `DB_PASSWORD=${cpanelPassword}`;
        if (line.startsWith('DB_NAME=')) return 'DB_NAME=nisapoti_Axia';
        if (line.startsWith('DB_PORT=')) return 'DB_PORT=3306';
        if (line.startsWith('DB_SOURCE=')) return 'DB_SOURCE=cpanel';
        if (line.startsWith('DB_SWITCHED_AT=')) return `DB_SWITCHED_AT=${new Date().toISOString()}`;
      } else {
        if (line.startsWith('DB_HOST=')) return 'DB_HOST=localhost';
        if (line.startsWith('DB_USER=')) return 'DB_USER=axia_backup_user';
        if (line.startsWith('DB_PASSWORD=')) return `DB_PASSWORD=${vpsPassword}`;
        if (line.startsWith('DB_NAME=')) return 'DB_NAME=axia_backup';
        if (line.startsWith('DB_PORT=')) return 'DB_PORT=3306';
        if (line.startsWith('DB_SOURCE=')) return 'DB_SOURCE=vps_backup';
        if (line.startsWith('DB_SWITCHED_AT=')) return `DB_SWITCHED_AT=${new Date().toISOString()}`;
      }
      return line;
    });

    // Add missing lines if they don't exist
    const hasDbHost = updatedLines.some(l => l.startsWith('DB_HOST='));
    const hasDbSource = updatedLines.some(l => l.startsWith('DB_SOURCE='));
    
    if (target === 'cpanel') {
      if (!hasDbHost) {
        updatedLines.push('DB_HOST=192.250.229.162');
        updatedLines.push('DB_USER=nisapoti_Axia');
        updatedLines.push(`DB_PASSWORD=${cpanelPassword}`);
        updatedLines.push('DB_NAME=nisapoti_Axia');
        updatedLines.push('DB_PORT=3306');
      }
      if (!hasDbSource) {
        updatedLines.push('DB_SOURCE=cpanel');
      }
      updatedLines.push(`DB_SWITCHED_AT=${new Date().toISOString()}`);
    } else {
      if (!hasDbHost) {
        updatedLines.push('DB_HOST=localhost');
        updatedLines.push('DB_USER=axia_backup_user');
        updatedLines.push(`DB_PASSWORD=${vpsPassword}`);
        updatedLines.push('DB_NAME=axia_backup');
        updatedLines.push('DB_PORT=3306');
      }
      if (!hasDbSource) {
        updatedLines.push('DB_SOURCE=vps_backup');
      }
      updatedLines.push(`DB_SWITCHED_AT=${new Date().toISOString()}`);
    }

    // Write updated env file
    await fs.writeFile(envFile, updatedLines.join('\n'), 'utf-8');

    return NextResponse.json({
      success: true,
      message: `Switched to ${target === 'cpanel' ? 'cPanel' : 'VPS backup'} database`,
      current: {
        source: target === 'cpanel' ? 'cpanel' : 'vps_backup',
        host: target === 'cpanel' ? '192.250.229.162' : 'localhost',
        database: target === 'cpanel' ? 'nisapoti_Axia' : 'axia_backup'
      }
    });

  } catch (error: any) {
    console.error('Database switch error:', error);
    return NextResponse.json(
      { error: 'Failed to switch database', details: error?.message },
      { status: 500 }
    );
  }
}

