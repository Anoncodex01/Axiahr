import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { checkSystemAlerts } from '@/lib/alertChecker';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// This endpoint checks system health and generates alerts
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('adminAuthToken')?.value || 
                  request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (decoded.type !== 'admin' || decoded.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden - Super admin only' }, { status: 403 });
    }

    // Check system metrics and generate alerts
    const alerts = await checkSystemAlerts();

    // Also check system resources directly
    const healthChecks: any = {};

    try {
      const platform = process.platform;
      const isDarwin = platform === 'darwin'; // macOS
      
      // Check CPU
      let cpuUsage = 0;
      if (isDarwin) {
        try {
          const cpuInfo = await execAsync("top -l 1 | grep 'CPU usage' | awk '{print $3}' | sed 's/%//'");
          cpuUsage = parseFloat(cpuInfo.stdout.trim()) || 0;
        } catch {}
      } else {
        try {
          const cpuInfo = await execAsync("top -bn1 | grep 'Cpu(s)' | sed 's/.*, *\\([0-9.]*\\)%* id.*/\\1/' | awk '{print 100 - $1}'");
          cpuUsage = parseFloat(cpuInfo.stdout.trim()) || 0;
        } catch {}
      }
      healthChecks.cpu = {
        usage: cpuUsage,
        status: cpuUsage > 80 ? 'critical' : cpuUsage > 60 ? 'warning' : 'ok'
      };

      // Check Memory
      let memPercentage = 0;
      if (isDarwin) {
        try {
          // Get total physical memory from sysctl (most accurate)
          const totalMemInfo = await execAsync("sysctl -n hw.memsize");
          const memTotal = parseInt(totalMemInfo.stdout.trim()) || 0;
          
          // Get memory stats from vm_stat
          const memInfo = await execAsync("vm_stat");
          
          // Extract page size from vm_stat output
          const pageSizeMatch = memInfo.stdout.match(/page size of (\d+) bytes/);
          const pageSize = pageSizeMatch ? parseInt(pageSizeMatch[1]) : 4096;
          
          // Parse memory categories
          const freeMatch = memInfo.stdout.match(/Pages free:\s+(\d+)/);
          const activeMatch = memInfo.stdout.match(/Pages active:\s+(\d+)/);
          const inactiveMatch = memInfo.stdout.match(/Pages inactive:\s+(\d+)/);
          const wiredMatch = memInfo.stdout.match(/Pages wired down:\s+(\d+)/);
          const speculativeMatch = memInfo.stdout.match(/Pages speculative:\s+(\d+)/);
          const compressedMatch = memInfo.stdout.match(/Pages stored in compressor:\s+(\d+)/);
          
          const free = freeMatch ? parseInt(freeMatch[1].replace(/\./g, '')) * pageSize : 0;
          const active = activeMatch ? parseInt(activeMatch[1].replace(/\./g, '')) * pageSize : 0;
          const inactive = inactiveMatch ? parseInt(inactiveMatch[1].replace(/\./g, '')) * pageSize : 0;
          const wired = wiredMatch ? parseInt(wiredMatch[1].replace(/\./g, '')) * pageSize : 0;
          const speculative = speculativeMatch ? parseInt(speculativeMatch[1].replace(/\./g, '')) * pageSize : 0;
          const compressed = compressedMatch ? parseInt(compressedMatch[1].replace(/\./g, '')) * pageSize : 0;
          
          const memUsed = active + inactive + wired + speculative + (compressed || 0);
          const calculatedTotal = memUsed + free;
          const finalTotal = memTotal > 0 ? memTotal : calculatedTotal;
          
          memPercentage = finalTotal > 0 ? (memUsed / finalTotal) * 100 : 0;
        } catch {}
      } else {
        try {
          const memInfo = await execAsync("free -b | grep Mem");
          const memMatch = memInfo.stdout.match(/Mem:\s+(\d+)\s+(\d+)/);
          const memTotal = memMatch ? parseInt(memMatch[1]) : 0;
          const memUsed = memMatch ? parseInt(memMatch[2]) : 0;
          memPercentage = memTotal > 0 ? (memUsed / memTotal) * 100 : 0;
        } catch {}
      }
      healthChecks.memory = {
        usage: memPercentage,
        status: memPercentage > 90 ? 'critical' : memPercentage > 75 ? 'warning' : 'ok'
      };

      // Check Disk
      let diskPercentage = 0;
      if (isDarwin) {
        try {
          const diskInfo = await execAsync("df -k / | tail -1");
          const diskMatch = diskInfo.stdout.match(/(\d+)%/);
          diskPercentage = diskMatch ? parseFloat(diskMatch[1]) : 0;
        } catch {}
      } else {
        try {
          const diskInfo = await execAsync("df -B1 / | tail -1");
          const diskMatch = diskInfo.stdout.match(/(\d+)%/);
          diskPercentage = diskMatch ? parseFloat(diskMatch[1]) : 0;
        } catch {}
      }
      healthChecks.disk = {
        usage: diskPercentage,
        status: diskPercentage > 90 ? 'critical' : diskPercentage > 80 ? 'warning' : 'ok'
      };
    } catch (error: any) {
      console.error('Error checking system health:', error);
      healthChecks.error = error.message;
    }

    return NextResponse.json({
      success: true,
      alerts,
      healthChecks
    });
  } catch (error: any) {
    console.error('Error in metrics check:', error);
    return NextResponse.json(
      { error: 'Failed to check metrics', details: error.message },
      { status: 500 }
    );
  }
}

