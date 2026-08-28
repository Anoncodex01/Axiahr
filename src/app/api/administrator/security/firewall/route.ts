import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { verifyToken } from '@/lib/auth';

const execAsync = promisify(exec);

// GET - Get firewall status
export async function GET(request: NextRequest) {
  try {
    // Verify administrator authentication
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
        enabled: false,
        status: 'not_supported',
        message: 'Firewall management is only available on Linux servers'
      });
    }

    // Check UFW status
    let ufwStatus = 'inactive';
    let ufwEnabled = false;
    try {
      const { stdout } = await execAsync('ufw status | head -1');
      if (stdout.includes('active')) {
        ufwStatus = 'active';
        ufwEnabled = true;
      }
    } catch (error) {
      // UFW might not be installed
    }

    // Get allowed ports
    const allowedPorts: number[] = [];
    try {
      const { stdout } = await execAsync('ufw status numbered 2>/dev/null | grep -E "^\\[.*\\].*ALLOW" | grep -oE "\\d+/tcp|\\d+/udp" | grep -oE "\\d+" | sort -u || echo ""');
      const ports = stdout.trim().split('\n').filter(Boolean).map(Number).filter(p => !isNaN(p));
      allowedPorts.push(...ports);
    } catch (error) {
      // Ignore errors
    }

    // Check fail2ban status
    let fail2banEnabled = false;
    const activeJails: string[] = [];
    try {
      const { stdout } = await execAsync('fail2ban-client status 2>/dev/null | grep "Number of jail" || echo "0"');
      if (stdout.includes('Number of jail') && !stdout.includes('0')) {
        fail2banEnabled = true;
        const jailsOutput = await execAsync('fail2ban-client status 2>/dev/null | grep "Jail list" | cut -d: -f2 | tr "," "\\n" | xargs -n1 echo || echo ""');
        const jails = jailsOutput.stdout.trim().split('\n').filter(Boolean).map(j => j.trim());
        activeJails.push(...jails);
      }
    } catch (error) {
      // fail2ban might not be installed
    }

    return NextResponse.json({
      enabled: ufwEnabled,
      status: ufwStatus,
      allowedPorts,
      blockedPorts: [],
      fail2ban: {
        enabled: fail2banEnabled,
        activeJails
      },
      rateLimit: {
        enabled: true,
        sshAttempts: 3
      }
    });
  } catch (error: any) {
    console.error('Error fetching firewall status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch firewall status', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Configure firewall
export async function POST(request: NextRequest) {
  try {
    // Verify administrator authentication
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
    const { action, port, protocol = 'tcp' } = body;

    const platform = process.platform;
    if (platform !== 'linux') {
      return NextResponse.json(
        { error: 'Firewall management is only available on Linux servers' },
        { status: 400 }
      );
    }

    let result = '';

    switch (action) {
      case 'enable':
        result = (await execAsync('echo "y" | ufw enable')).stdout;
        break;
      case 'disable':
        result = (await execAsync('ufw disable')).stdout;
        break;
      case 'allow_port':
        if (!port) {
          return NextResponse.json({ error: 'Port is required' }, { status: 400 });
        }
        result = (await execAsync(`ufw allow ${port}/${protocol}`)).stdout;
        break;
      case 'deny_port':
        if (!port) {
          return NextResponse.json({ error: 'Port is required' }, { status: 400 });
        }
        result = (await execAsync(`ufw deny ${port}/${protocol}`)).stdout;
        break;
      case 'enable_fail2ban':
        result = (await execAsync('systemctl enable fail2ban && systemctl start fail2ban')).stdout;
        break;
      case 'disable_fail2ban':
        result = (await execAsync('systemctl stop fail2ban && systemctl disable fail2ban')).stdout;
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Firewall ${action} completed`,
      output: result
    });
  } catch (error: any) {
    console.error('Error configuring firewall:', error);
    return NextResponse.json(
      { error: 'Failed to configure firewall', details: error.message },
      { status: 500 }
    );
  }
}

