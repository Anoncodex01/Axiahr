import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';

const execAsync = promisify(exec);

// GET - Get current database status
export async function GET(request: NextRequest) {
  try {
    const envFile = '/var/www/axia-nextjs/.env.production';
    
    let currentConfig: any = {};
    let source = 'unknown';
    
    try {
      const envContent = await fs.readFile(envFile, 'utf-8');
      const lines = envContent.split('\n');
      lines.forEach(line => {
        if (line.startsWith('DB_') && !line.startsWith('DB_SOURCE')) {
          const [key, ...valueParts] = line.split('=');
          if (key && valueParts.length > 0) {
            const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
            currentConfig[key.trim()] = value;
          }
        }
        if (line.startsWith('DB_SOURCE=')) {
          source = line.split('=')[1]?.trim().replace(/^["']|["']$/g, '') || 'unknown';
        }
      });
    } catch (error) {
      console.error('Error reading env file:', error);
    }

    // Test connections
    const testConnection = async (host: string, user: string, password: string, database: string, port: string) => {
      try {
        await execAsync(
          `mysql -h ${host} -P ${port} -u ${user} -p${password} ${database} -e "SELECT 1;" 2>&1`,
          { timeout: 5000 }
        );
        return { connected: true, error: null };
      } catch (error: any) {
        return { connected: false, error: error.message || 'Connection failed' };
      }
    };

    const cpanelStatus = await testConnection(
      '192.250.229.162',
      'nisapoti_Axia',
      process.env.CPANEL_DB_PASSWORD || '',
      'nisapoti_Axia',
      '3306'
    );

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
      console.error('Error reading credentials file:', error);
    }

    const vpsStatus = vpsPassword ? await testConnection(
      'localhost',
      'axia_backup_user',
      vpsPassword,
      'axia_backup',
      '3306'
    ) : { connected: false, error: 'Credentials not found' };

    return NextResponse.json({
      current: {
        source,
        config: currentConfig
      },
      cpanel: {
        host: '192.250.229.162',
        database: 'nisapoti_Axia',
        ...cpanelStatus
      },
      vps: {
        host: 'localhost',
        database: 'axia_backup',
        ...vpsStatus
      }
    });

  } catch (error: any) {
    console.error('Get database status error:', error);
    return NextResponse.json(
      { error: 'Failed to get database status', details: error?.message },
      { status: 500 }
    );
  }
}

