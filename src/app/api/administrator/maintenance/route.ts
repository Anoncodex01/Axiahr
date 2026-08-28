import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { executeSingleQuery, executeQuery } from '@/lib/database';

// GET - Get maintenance status
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

    const result = await executeQuery<any>(
      'SELECT enabled, message, updated_at, updated_by FROM maintenance_mode LIMIT 1'
    );

    if (result.length === 0) {
      return NextResponse.json({ enabled: false, message: '', updatedAt: null, updatedBy: null });
    }

    return NextResponse.json({
      enabled: Boolean(result[0].enabled),
      message: result[0].message || '',
      updatedAt: result[0].updated_at,
      updatedBy: result[0].updated_by || null
    });
  } catch (error: any) {
    console.error('Error fetching maintenance status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch maintenance status', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Update maintenance mode
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
    const { enabled, message } = body;

    // Ensure table exists
    await executeSingleQuery(`
      CREATE TABLE IF NOT EXISTS maintenance_mode (
        id INT PRIMARY KEY AUTO_INCREMENT,
        enabled BOOLEAN DEFAULT FALSE,
        message TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        updated_by VARCHAR(255),
        UNIQUE KEY unique_maintenance (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Check if record exists
    const existing = await executeQuery<any>('SELECT id FROM maintenance_mode LIMIT 1');
    
    if (existing.length === 0) {
      // Insert new record
      await executeSingleQuery(
        'INSERT INTO maintenance_mode (enabled, message, updated_by) VALUES (?, ?, ?)',
        [enabled ? 1 : 0, message || 'System is under maintenance. We will be back shortly.', decoded.email || 'admin']
      );
    } else {
      // Update existing record
      await executeSingleQuery(
        'UPDATE maintenance_mode SET enabled = ?, message = ?, updated_by = ? WHERE id = ?',
        [enabled ? 1 : 0, message || 'System is under maintenance. We will be back shortly.', decoded.email || 'admin', existing[0].id]
      );
    }

    // Update environment variable for middleware (optional - middleware can also check DB via API)
    // Note: This requires file system access which is available in Node.js runtime
    // The middleware will check MAINTENANCE_MODE env var for fast checks
    try {
      const fs = require('fs');
      const path = require('path');
      const envPath = path.join(process.cwd(), '.env.local');
      let envContent = '';
      
      if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf8');
      }
      
      // Update or add MAINTENANCE_MODE
      if (envContent.includes('MAINTENANCE_MODE=')) {
        envContent = envContent.replace(
          /MAINTENANCE_MODE=.*/,
          `MAINTENANCE_MODE=${enabled ? 'true' : 'false'}`
        );
      } else {
        envContent += `\nMAINTENANCE_MODE=${enabled ? 'true' : 'false'}\n`;
      }
      
      fs.writeFileSync(envPath, envContent);
    } catch (error) {
      console.warn('Could not update .env.local file (this is optional):', error);
      // Continue anyway - database is the source of truth
    }

    return NextResponse.json({
      success: true,
      message: `Maintenance mode ${enabled ? 'enabled' : 'disabled'} successfully`,
      enabled,
      maintenanceMessage: message || ''
    });
  } catch (error: any) {
    console.error('Error updating maintenance mode:', error);
    return NextResponse.json(
      { error: 'Failed to update maintenance mode', details: error.message },
      { status: 500 }
    );
  }
}

