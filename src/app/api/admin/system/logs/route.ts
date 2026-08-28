import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { readFile, readdir, stat, open } from 'fs/promises';
import { join } from 'path';

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  source: string;
}

/**
 * Get logs from various sources
 * Supports: application logs, system logs, PM2 logs, Nginx logs
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const token = request.cookies.get('adminAuthToken')?.value || 
                  request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (decoded.type !== 'admin' || decoded.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden - Super admin only' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const logType = searchParams.get('type') || 'application'; // application, system, error, access, pm2
    const lines = parseInt(searchParams.get('lines') || '100'); // Number of lines to fetch
    const search = searchParams.get('search') || ''; // Search filter

    const logs: LogEntry[] = [];

    try {
      if (logType === 'application' || logType === 'error') {
        // Application logs from Next.js/Node.js
        const logFiles = [
          join(process.cwd(), 'logs', 'app.log'),
          join(process.cwd(), 'logs', 'error.log'),
          join(process.cwd(), 'logs', 'combined.log'),
          join(process.cwd(), '.next', 'trace'), // Next.js trace
        ];

        // Filter for error logs only if type is 'error'
        const isErrorOnly = logType === 'error';

        for (const logFile of logFiles) {
          try {
            const fileStat = await stat(logFile);
            // Only read files that are not too large (max 10MB)
            if (fileStat.size > 10 * 1024 * 1024) {
              // Read only last portion of large files (last 2MB)
              const buffer = Buffer.alloc(Math.min(2 * 1024 * 1024, fileStat.size));
              const fileHandle = await open(logFile, 'r');
              const startPos = Math.max(0, fileStat.size - buffer.length);
              await fileHandle.read(buffer, 0, buffer.length, startPos);
              await fileHandle.close();
              const content = buffer.toString('utf-8');
              const lines_array = content.split('\n').filter(Boolean);
              const recentLines = lines_array.slice(-lines);
              
              recentLines.forEach(line => {
                if (search && !line.toLowerCase().includes(search.toLowerCase())) return;
                if (isErrorOnly && !line.match(/error|ERROR|exception|Exception|fail|FAIL/i)) return;
                
                // Parse log line (adjust based on your log format)
                const timestampMatch = line.match(/\[?(\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}[.\d]*Z?)\]?/);
                const timestamp = timestampMatch ? timestampMatch[1] : new Date().toISOString();
                
                const levelMatch = line.match(/(ERROR|WARN|INFO|DEBUG|error|warn|info|debug)/i);
                const level = levelMatch ? levelMatch[1].toUpperCase() : (isErrorOnly ? 'ERROR' : 'INFO');
                
                logs.push({
                  timestamp,
                  level,
                  message: line,
                  source: 'application'
                });
              });
            } else {
              const content = await readFile(logFile, 'utf-8');
              const lines_array = content.split('\n').filter(Boolean);
              const recentLines = lines_array.slice(-lines);
              
              recentLines.forEach(line => {
                if (search && !line.toLowerCase().includes(search.toLowerCase())) return;
                if (isErrorOnly && !line.match(/error|ERROR|exception|Exception|fail|FAIL/i)) return;
                
                // Parse log line
                const timestampMatch = line.match(/\[?(\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}[.\d]*Z?)\]?/);
                const timestamp = timestampMatch ? timestampMatch[1] : new Date().toISOString();
                
                const levelMatch = line.match(/(ERROR|WARN|INFO|DEBUG|error|warn|info|debug)/i);
                const level = levelMatch ? levelMatch[1].toUpperCase() : (isErrorOnly ? 'ERROR' : 'INFO');
                
                logs.push({
                  timestamp,
                  level,
                  message: line,
                  source: 'application'
                });
              });
            }
          } catch (error) {
            // File doesn't exist, skip
          }
        }
      } else if (logType === 'system') {
        // System logs (Linux: /var/log/syslog, macOS: system.log)
        const platform = process.platform;
        const systemLogPaths = platform === 'darwin' 
          ? ['/var/log/system.log']
          : ['/var/log/syslog', '/var/log/messages'];
        
        for (const logPath of systemLogPaths) {
          try {
            const content = await readFile(logPath, 'utf-8');
            const lines_array = content.split('\n').filter(Boolean);
            const recentLines = lines_array.slice(-lines);
            
            recentLines.forEach(line => {
              if (search && !line.toLowerCase().includes(search.toLowerCase())) return;
              
              const timestampMatch = line.match(/(\w+\s+\d+\s+\d{2}:\d{2}:\d{2})/);
              const timestamp = timestampMatch ? timestampMatch[1] : new Date().toISOString();
              
              logs.push({
                timestamp,
                level: 'SYSTEM',
                message: line,
                source: 'system'
              });
            });
          } catch (error) {
            // Can't read system logs (permission issue), skip
          }
        }
      } else if (logType === 'pm2') {
        // PM2 logs (if running on server)
        const pm2LogPaths = [
          '/var/log/pm2/axia-nextjs-out.log',
          '/var/log/pm2/axia-nextjs-error.log',
          join(process.cwd(), '.pm2', 'logs', 'axia-nextjs-out.log'),
          join(process.cwd(), '.pm2', 'logs', 'axia-nextjs-error.log'),
        ];

        for (const logPath of pm2LogPaths) {
          try {
            const content = await readFile(logPath, 'utf-8');
            const lines_array = content.split('\n').filter(Boolean);
            const recentLines = lines_array.slice(-lines);
            
            recentLines.forEach(line => {
              if (search && !line.toLowerCase().includes(search.toLowerCase())) return;
              
              const timestampMatch = line.match(/(\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2})/);
              const timestamp = timestampMatch ? timestampMatch[1] : new Date().toISOString();
              
              const level = logPath.includes('error') ? 'ERROR' : 'INFO';
              
              logs.push({
                timestamp,
                level,
                message: line,
                source: 'pm2'
              });
            });
          } catch (error) {
            // File doesn't exist, skip
          }
        }
      } else if (logType === 'nginx') {
        // Nginx access and error logs
        const nginxLogPaths = [
          '/var/log/nginx/access.log',
          '/var/log/nginx/error.log',
          '/var/log/nginx/axia.co.tz.access.log',
          '/var/log/nginx/axia.co.tz.error.log',
        ];

        for (const logPath of nginxLogPaths) {
          try {
            const content = await readFile(logPath, 'utf-8');
            const lines_array = content.split('\n').filter(Boolean);
            const recentLines = lines_array.slice(-lines);
            
            recentLines.forEach(line => {
              if (search && !line.toLowerCase().includes(search.toLowerCase())) return;
              
              logs.push({
                timestamp: new Date().toISOString(),
                level: logPath.includes('error') ? 'ERROR' : 'INFO',
                message: line,
                source: 'nginx'
              });
            });
          } catch (error) {
            // File doesn't exist, skip
          }
        }
      } else if (logType === 'database') {
        // Database query logs (if enabled)
        const dbLogPaths = [
          join(process.cwd(), 'logs', 'database.log'),
          join(process.cwd(), 'logs', 'db-queries.log'),
        ];

        for (const logPath of dbLogPaths) {
          try {
            const content = await readFile(logPath, 'utf-8');
            const lines_array = content.split('\n').filter(Boolean);
            const recentLines = lines_array.slice(-lines);
            
            recentLines.forEach(line => {
              if (search && !line.toLowerCase().includes(search.toLowerCase())) return;
              
              logs.push({
                timestamp: new Date().toISOString(),
                level: 'INFO',
                message: line,
                source: 'database'
              });
            });
          } catch (error) {
            // File doesn't exist, skip
          }
        }
      }

      // Sort by timestamp (newest first)
      logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      return NextResponse.json({
        success: true,
        logs: logs.slice(0, lines), // Limit to requested number
        total: logs.length,
        type: logType
      });
    } catch (error: any) {
      console.error('Error reading logs:', error);
      return NextResponse.json({
        success: true,
        logs: [],
        total: 0,
        type: logType,
        error: error.message
      });
    }
  } catch (error: any) {
    console.error('Error in logs API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch logs', details: error.message },
      { status: 500 }
    );
  }
}

