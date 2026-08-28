import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Cache metrics for 10 seconds to avoid too frequent system calls
let cachedMetrics: any = null;
let cacheTimestamp = 0;
const CACHE_TTL = 10000; // 10 seconds

async function getSystemMetrics() {
  const now = Date.now();
  if (cachedMetrics && (now - cacheTimestamp) < CACHE_TTL) {
    return cachedMetrics;
  }

  const platform = process.platform;
  const isDarwin = platform === 'darwin'; // macOS
  const isLinux = platform === 'linux';

  try {
    let cpuUsage = 0;
    let cores = 1;
    let loadAvg: number[] = [0, 0, 0];
    let memTotal = 0;
    let memUsed = 0;
    let memFree = 0;
    let memCached = 0;
    let memPercentage = 0;
    let diskTotal = 0;
    let diskUsed = 0;
    let diskFree = 0;
    let diskPercentage = 0;
    let bytesIn = 0;
    let bytesOut = 0;
    let uptime = 0;

    if (isLinux) {
      // Linux commands
      try {
        const cpuInfo = await execAsync("top -bn1 | grep 'Cpu(s)' | sed 's/.*, *\\([0-9.]*\\)%* id.*/\\1/' | awk '{print 100 - $1}'");
        cpuUsage = parseFloat(cpuInfo.stdout.trim()) || 0;
      } catch {}

      try {
        const coresInfo = await execAsync("nproc");
        cores = parseInt(coresInfo.stdout.trim()) || 1;
      } catch {}

      try {
        const loadInfo = await execAsync("uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//'");
        loadAvg = loadInfo.stdout.trim().split(',').map((v: string) => parseFloat(v.trim())).filter((v: number) => !isNaN(v));
      } catch {}

      try {
        const memInfo = await execAsync("free -b | grep Mem");
        const memMatch = memInfo.stdout.match(/Mem:\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/);
        memTotal = memMatch ? parseInt(memMatch[1]) : 0;
        memUsed = memMatch ? parseInt(memMatch[2]) : 0;
        memFree = memMatch ? parseInt(memMatch[3]) : 0;
        memCached = memMatch ? parseInt(memMatch[6]) : 0;
        memPercentage = memTotal > 0 ? (memUsed / memTotal) * 100 : 0;
      } catch {}

      try {
        const diskInfo = await execAsync("df -B1 / | tail -1");
        const diskMatch = diskInfo.stdout.match(/\S+\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)%/);
        diskTotal = diskMatch ? parseInt(diskMatch[1]) : 0;
        diskUsed = diskMatch ? parseInt(diskMatch[2]) : 0;
        diskFree = diskMatch ? parseInt(diskMatch[3]) : 0;
        diskPercentage = diskMatch ? parseFloat(diskMatch[4]) : 0;
      } catch {}

      try {
        const netInfo = await execAsync("cat /proc/net/dev | grep -E 'eth0|ens|enp' | head -1 | awk '{print $2, $10}'");
        const netMatch = netInfo.stdout.match(/(\d+)\s+(\d+)/);
        bytesIn = netMatch ? parseInt(netMatch[1]) : 0;
        bytesOut = netMatch ? parseInt(netMatch[2]) : 0;
      } catch {}

      try {
        const uptimeInfo = await execAsync("cat /proc/uptime | awk '{print $1}'");
        uptime = parseInt(uptimeInfo.stdout.trim()) || 0;
      } catch {}
    } else if (isDarwin) {
      // macOS commands
      try {
        const cpuInfo = await execAsync("top -l 1 | grep 'CPU usage' | awk '{print $3}' | sed 's/%//'");
        cpuUsage = parseFloat(cpuInfo.stdout.trim()) || 0;
      } catch {}

      try {
        const coresInfo = await execAsync("sysctl -n hw.ncpu");
        cores = parseInt(coresInfo.stdout.trim()) || 1;
      } catch {}

      try {
        const loadInfo = await execAsync("uptime | awk -F'load averages:' '{print $2}' | awk '{print $1}' | sed 's/,//'");
        const load = parseFloat(loadInfo.stdout.trim());
        loadAvg = !isNaN(load) ? [load, 0, 0] : [0, 0, 0];
      } catch {}

      try {
        // Get total physical memory from sysctl (most accurate)
        const totalMemInfo = await execAsync("sysctl -n hw.memsize");
        memTotal = parseInt(totalMemInfo.stdout.trim()) || 0;
        
        // Get memory stats from vm_stat
        const memInfo = await execAsync("vm_stat");
        
        // Extract page size from vm_stat output (usually 4096 or 16384)
        const pageSizeMatch = memInfo.stdout.match(/page size of (\d+) bytes/);
        const pageSize = pageSizeMatch ? parseInt(pageSizeMatch[1]) : 4096;
        
        // Parse all memory categories
        const freeMatch = memInfo.stdout.match(/Pages free:\s+(\d+)/);
        const activeMatch = memInfo.stdout.match(/Pages active:\s+(\d+)/);
        const inactiveMatch = memInfo.stdout.match(/Pages inactive:\s+(\d+)/);
        const wiredMatch = memInfo.stdout.match(/Pages wired down:\s+(\d+)/);
        const speculativeMatch = memInfo.stdout.match(/Pages speculative:\s+(\d+)/);
        const purgeableMatch = memInfo.stdout.match(/Pages purgeable:\s+(\d+)/);
        const throttledMatch = memInfo.stdout.match(/Pages throttled:\s+(\d+)/);
        const compressedMatch = memInfo.stdout.match(/Pages stored in compressor:\s+(\d+)/);
        
        const free = freeMatch ? parseInt(freeMatch[1].replace(/\./g, '')) * pageSize : 0;
        const active = activeMatch ? parseInt(activeMatch[1].replace(/\./g, '')) * pageSize : 0;
        const inactive = inactiveMatch ? parseInt(inactiveMatch[1].replace(/\./g, '')) * pageSize : 0;
        const wired = wiredMatch ? parseInt(wiredMatch[1].replace(/\./g, '')) * pageSize : 0;
        const speculative = speculativeMatch ? parseInt(speculativeMatch[1].replace(/\./g, '')) * pageSize : 0;
        const purgeable = purgeableMatch ? parseInt(purgeableMatch[1].replace(/\./g, '')) * pageSize : 0;
        const compressed = compressedMatch ? parseInt(compressedMatch[1].replace(/\./g, '')) * pageSize : 0;
        
        // Used memory = active + inactive + wired + speculative + compressed
        memUsed = active + inactive + wired + speculative + (compressed || 0);
        memFree = free;
        memCached = inactive + purgeable;
        
        // If sysctl didn't work, calculate from pages
        if (memTotal === 0) {
          memTotal = memUsed + memFree;
        }
        
        memPercentage = memTotal > 0 ? (memUsed / memTotal) * 100 : 0;
      } catch {}

      try {
        const diskInfo = await execAsync("df -k / | tail -1");
        const diskMatch = diskInfo.stdout.match(/\S+\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)%/);
        diskTotal = diskMatch ? parseInt(diskMatch[1]) * 1024 : 0; // Convert KB to bytes
        diskUsed = diskMatch ? parseInt(diskMatch[2]) * 1024 : 0;
        diskFree = diskMatch ? parseInt(diskMatch[3]) * 1024 : 0;
        diskPercentage = diskMatch ? parseFloat(diskMatch[4]) : 0;
      } catch {}

      try {
        const netInfo = await execAsync("netstat -ib | grep -E '^en|^eth' | head -1 | awk '{print $7, $10}'");
        const netMatch = netInfo.stdout.match(/(\d+)\s+(\d+)/);
        bytesIn = netMatch ? parseInt(netMatch[1]) : 0;
        bytesOut = netMatch ? parseInt(netMatch[2]) : 0;
      } catch {}

      try {
        const uptimeInfo = await execAsync("sysctl -n kern.boottime | awk '{print $4}' | sed 's/,//'");
        const bootTime = parseInt(uptimeInfo.stdout.trim());
        uptime = Math.floor((Date.now() / 1000) - bootTime);
      } catch {}
    }

    const metrics = {
      cpu: {
        usage: Math.min(100, Math.max(0, cpuUsage)),
        cores,
        loadAverage: loadAvg.length > 0 ? loadAvg : [0, 0, 0]
      },
      memory: {
        used: memUsed,
        total: memTotal,
        percentage: Math.min(100, Math.max(0, memPercentage)),
        cached: memCached,
        free: memFree
      },
      disk: {
        used: diskUsed,
        total: diskTotal,
        percentage: Math.min(100, Math.max(0, diskPercentage)),
        free: diskFree
      },
      network: {
        bytesIn,
        bytesOut,
        packetsIn: 0, // Would need additional parsing
        packetsOut: 0
      },
      uptime,
      timestamp: new Date().toISOString()
    };

    cachedMetrics = metrics;
    cacheTimestamp = now;

    return metrics;
  } catch (error: any) {
    console.error('Error getting system metrics:', error);
    // Return default/fallback metrics
    return {
      cpu: { usage: 0, cores: 1, loadAverage: [0, 0, 0] },
      memory: { used: 0, total: 0, percentage: 0, cached: 0, free: 0 },
      disk: { used: 0, total: 0, percentage: 0, free: 0 },
      network: { bytesIn: 0, bytesOut: 0, packetsIn: 0, packetsOut: 0 },
      uptime: 0,
      timestamp: new Date().toISOString()
    };
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const token = request.cookies.get('adminAuthToken')?.value || 
                  request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // In production, verify token here
    // For now, we'll allow access if token exists

    const metrics = await getSystemMetrics();

    return NextResponse.json({
      success: true,
      metrics
    });
  } catch (error: any) {
    console.error('Error in metrics API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics', details: error.message },
      { status: 500 }
    );
  }
}

