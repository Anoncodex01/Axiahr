import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { verifyToken } from '@/lib/auth';

const execAsync = promisify(exec);

// GET - Get SSH status
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
        passwordLogin: true,
        port: 22,
        ipWhitelist: [],
        logMonitoring: false,
        message: 'SSH management is only available on Linux servers'
      });
    }

    // Check SSH password authentication
    let passwordLogin = true;
    try {
      const { stdout } = await execAsync('grep -E "^PasswordAuthentication|^#PasswordAuthentication" /etc/ssh/sshd_config | tail -1');
      if (stdout.includes('PasswordAuthentication no')) {
        passwordLogin = false;
      }
    } catch (error) {
      // Ignore errors
    }

    // Get SSH port
    let port = 22;
    try {
      const { stdout } = await execAsync('grep -E "^Port|^#Port" /etc/ssh/sshd_config | tail -1');
      const portMatch = stdout.match(/Port\s+(\d+)/);
      if (portMatch) {
        port = parseInt(portMatch[1]);
      }
    } catch (error) {
      // Ignore errors
    }

    // Get IP whitelist (from /etc/hosts.allow or similar)
    const ipWhitelist: string[] = [];
    // TODO: Implement IP whitelist reading

    return NextResponse.json({
      passwordLogin,
      port,
      ipWhitelist,
      logMonitoring: true
    });
  } catch (error: any) {
    console.error('Error fetching SSH status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch SSH status', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Configure SSH
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
    const { action, ip, port } = body;

    const platform = process.platform;
    if (platform !== 'linux') {
      return NextResponse.json(
        { error: 'SSH management is only available on Linux servers' },
        { status: 400 }
      );
    }

    // WARNING: SSH configuration changes require careful handling
    // These operations should be done with extreme caution
    let result = '';

    switch (action) {
      case 'disable_password_login':
        // Backup config first
        await execAsync('cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup');
        // Disable password authentication
        await execAsync('sed -i "s/#PasswordAuthentication yes/PasswordAuthentication no/" /etc/ssh/sshd_config');
        await execAsync('sed -i "s/PasswordAuthentication yes/PasswordAuthentication no/" /etc/ssh/sshd_config');
        result = 'Password authentication disabled. SSH service restart required.';
        break;
      case 'add_ip_whitelist':
        if (!ip) {
          return NextResponse.json({ error: 'IP is required' }, { status: 400 });
        }
        // Add to hosts.allow
        await execAsync(`echo "sshd: ${ip}" >> /etc/hosts.allow`);
        result = `IP ${ip} added to whitelist`;
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: result,
      warning: action === 'disable_password_login' ? 'SSH service restart required for changes to take effect' : undefined
    });
  } catch (error: any) {
    console.error('Error configuring SSH:', error);
    return NextResponse.json(
      { error: 'Failed to configure SSH', details: error.message },
      { status: 500 }
    );
  }
}

