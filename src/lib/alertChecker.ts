import { executeQuery, getPoolStats } from './database';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface Alert {
  id: string;
  priority: 'P0' | 'P1' | 'P2';
  title: string;
  message: string;
  timestamp: string;
  acknowledged: boolean;
  resolved: boolean;
}

// Store alerts in memory (in production, use database)
let activeAlerts: Map<string, Alert> = new Map();

export async function checkSystemAlerts(): Promise<Alert[]> {
  const newAlerts: Alert[] = [];

  try {
    // Check 1: Zero applications for 30 minutes during business hours
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    const recentApps = await executeQuery(
      `SELECT COUNT(*) as count FROM applications WHERE created_at >= ?`,
      [thirtyMinutesAgo]
    );
    const appCount = recentApps[0]?.count || 0;
    
    // Business hours: 8 AM to 6 PM Tanzania time (UTC+3)
    // Convert to UTC: 5 AM to 3 PM UTC (8-3=5, 18-3=15)
    // For server time, adjust based on server timezone
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday
    
    // Business hours: Monday-Friday, 8 AM to 6 PM (server local time)
    // If server is in UTC, this would be 5 AM to 3 PM UTC (Tanzania is UTC+3)
    // Adjust these hours based on your server's timezone
    const isBusinessHours = currentDay >= 1 && currentDay <= 5 && // Monday to Friday
                           currentHour >= 8 && currentHour < 18; // 8 AM to 6 PM
    
    if (appCount === 0 && isBusinessHours) {
      const existingAlert = activeAlerts.get('alert-zero-apps');
      if (!existingAlert || existingAlert.resolved) {
        newAlerts.push({
          id: 'alert-zero-apps',
          priority: 'P0',
          title: 'No New Applications Received',
          message: 'No applications have been received in the last 30 minutes during business hours. This could indicate low traffic or a potential issue. Please verify the system is accessible and the application form is working.',
          timestamp: new Date().toISOString(),
          acknowledged: false,
          resolved: false
        });
      }
    } else {
      // Resolve alert if applications are coming in
      const existingAlert = activeAlerts.get('alert-zero-apps');
      if (existingAlert && !existingAlert.resolved) {
        existingAlert.resolved = true;
        activeAlerts.set('alert-zero-apps', existingAlert);
      }
    }

    // Check 2: Database connection pool health
    try {
      const poolStats = getPoolStats();
      if (poolStats.activeConnections >= poolStats.totalConnections * 0.9) {
        newAlerts.push({
          id: 'alert-db-pool-high',
          priority: 'P1',
          title: 'Database Connection Pool Near Capacity',
          message: `Active connections: ${poolStats.activeConnections}/${poolStats.totalConnections}. Consider increasing pool size.`,
          timestamp: new Date().toISOString(),
          acknowledged: false,
          resolved: false
        });
      }
    } catch (error) {
      // Pool stats unavailable
    }

    // Check 3: System resources (CPU, Memory, Disk)
    try {
      const platform = process.platform;
      const isDarwin = platform === 'darwin'; // macOS
      
      // CPU check
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
      
      if (cpuUsage > 80) {
        const existingAlert = activeAlerts.get('alert-cpu-high');
        if (!existingAlert || existingAlert.resolved) {
          newAlerts.push({
            id: 'alert-cpu-high',
            priority: 'P1',
            title: 'High CPU Usage',
            message: `CPU usage is at ${cpuUsage.toFixed(1)}%. Server may be experiencing performance issues.`,
            timestamp: new Date().toISOString(),
            acknowledged: false,
            resolved: false
          });
        }
      } else {
        const existingAlert = activeAlerts.get('alert-cpu-high');
        if (existingAlert && !existingAlert.resolved) {
          existingAlert.resolved = true;
          activeAlerts.set('alert-cpu-high', existingAlert);
        }
      }

      // Memory check
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
      
      if (memPercentage > 90) {
        const existingAlert = activeAlerts.get('alert-memory-high');
        if (!existingAlert || existingAlert.resolved) {
          newAlerts.push({
            id: 'alert-memory-high',
            priority: 'P1',
            title: 'High Memory Usage',
            message: `Memory usage is at ${memPercentage.toFixed(1)}%. Server may start swapping or crash.`,
            timestamp: new Date().toISOString(),
            acknowledged: false,
            resolved: false
          });
        }
      } else {
        const existingAlert = activeAlerts.get('alert-memory-high');
        if (existingAlert && !existingAlert.resolved) {
          existingAlert.resolved = true;
          activeAlerts.set('alert-memory-high', existingAlert);
        }
      }

      // Disk check
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
      
      if (diskPercentage > 90) {
        const existingAlert = activeAlerts.get('alert-disk-full');
        if (!existingAlert || existingAlert.resolved) {
          newAlerts.push({
            id: 'alert-disk-full',
            priority: 'P1',
            title: 'Disk Space Critical',
            message: `Disk usage is at ${diskPercentage.toFixed(1)}%. Free up space immediately to prevent system failures.`,
            timestamp: new Date().toISOString(),
            acknowledged: false,
            resolved: false
          });
        }
      } else if (diskPercentage > 80) {
        const existingAlert = activeAlerts.get('alert-disk-warning');
        if (!existingAlert || existingAlert.resolved) {
          newAlerts.push({
            id: 'alert-disk-warning',
            priority: 'P2',
            title: 'Disk Space Warning',
            message: `Disk usage is at ${diskPercentage.toFixed(1)}%. Consider cleaning up logs or old files.`,
            timestamp: new Date().toISOString(),
            acknowledged: false,
            resolved: false
          });
        }
      } else {
        // Resolve disk alerts if usage is below thresholds
        ['alert-disk-full', 'alert-disk-warning'].forEach(alertId => {
          const existingAlert = activeAlerts.get(alertId);
          if (existingAlert && !existingAlert.resolved) {
            existingAlert.resolved = true;
            activeAlerts.set(alertId, existingAlert);
          }
        });
      }
    } catch (error) {
      // System command errors - not critical
      console.error('Error checking system resources:', error);
    }
    
  } catch (error: any) {
    // Database connection error itself is an alert
    const existingAlert = activeAlerts.get('alert-db-connection');
    if (!existingAlert || existingAlert.resolved) {
      newAlerts.push({
        id: 'alert-db-connection',
        priority: 'P0',
        title: 'Database Connection Error',
        message: `Failed to connect to database: ${error.message}`,
        timestamp: new Date().toISOString(),
        acknowledged: false,
        resolved: false
      });
    }
  }

  // Update active alerts map
  newAlerts.forEach(alert => {
    if (!activeAlerts.has(alert.id)) {
      activeAlerts.set(alert.id, alert);
    } else {
      // Update existing alert if it's not resolved
      const existing = activeAlerts.get(alert.id);
      if (existing && !existing.resolved) {
        activeAlerts.set(alert.id, alert);
      }
    }
  });

  // Return all active alerts
  return Array.from(activeAlerts.values()).filter(a => !a.resolved);
}

export function getActiveAlerts(): Alert[] {
  return Array.from(activeAlerts.values()).filter(a => !a.resolved);
}

export function acknowledgeAlert(id: string): boolean {
  const alert = activeAlerts.get(id);
  if (alert) {
    alert.acknowledged = true;
    activeAlerts.set(id, alert);
    return true;
  }
  return false;
}

export function resolveAlert(id: string): boolean {
  const alert = activeAlerts.get(id);
  if (alert) {
    alert.resolved = true;
    activeAlerts.set(id, alert);
    return true;
  }
  return false;
}

