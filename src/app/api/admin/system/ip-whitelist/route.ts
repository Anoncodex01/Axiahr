import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeSingleQuery } from '@/lib/database';
import { verifyToken } from '@/lib/auth';

// Get IP whitelist
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

    // Get whitelist from database
    try {
      const whitelist = await executeQuery<any>(
        `SELECT id, ip, description, created_at as createdAt, created_by as createdBy, active
         FROM ip_whitelist
         ORDER BY created_at DESC`
      );
      
      // Format dates to ISO strings
      const formattedWhitelist = whitelist.map((entry: any) => ({
        ...entry,
        createdAt: entry.createdAt ? new Date(entry.createdAt).toISOString() : new Date().toISOString(),
        active: Boolean(entry.active)
      }));
      
      return NextResponse.json({ success: true, whitelist: formattedWhitelist });
    } catch (error: any) {
      // Table might not exist yet, try to create it
      if (error?.code === 'ER_NO_SUCH_TABLE') {
        console.log('📊 IP whitelist table does not exist. Creating it now...');
        try {
          await executeSingleQuery(`
            CREATE TABLE IF NOT EXISTS ip_whitelist (
              id VARCHAR(64) PRIMARY KEY,
              ip VARCHAR(45) NOT NULL,
              description TEXT,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              created_by VARCHAR(255),
              active BOOLEAN DEFAULT TRUE,
              INDEX idx_ip (ip),
              INDEX idx_active (active)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
          `);
          console.log('✅ IP whitelist table created successfully!');
          return NextResponse.json({ success: true, whitelist: [] });
        } catch (createError: any) {
          console.error('❌ Failed to create ip_whitelist table:', createError);
          return NextResponse.json({ success: true, whitelist: [] });
        }
      }
      throw error;
    }
  } catch (error: any) {
    console.error('Error fetching IP whitelist:', error);
    return NextResponse.json(
      { error: 'Failed to fetch IP whitelist' },
      { status: 500 }
    );
  }
}

// Add IP to whitelist
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

    const body = await request.json();
    const { ip, description } = body;

    if (!ip || !ip.trim()) {
      return NextResponse.json({ error: 'IP address is required' }, { status: 400 });
    }

    // Validate IP format (basic validation)
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;
    if (!ipRegex.test(ip.trim())) {
      return NextResponse.json({ error: 'Invalid IP address format' }, { status: 400 });
    }

    // Ensure table exists (create if it doesn't)
    try {
      await executeSingleQuery(`
        CREATE TABLE IF NOT EXISTS ip_whitelist (
          id VARCHAR(64) PRIMARY KEY,
          ip VARCHAR(45) NOT NULL,
          description TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          created_by VARCHAR(255),
          active BOOLEAN DEFAULT TRUE,
          INDEX idx_ip (ip),
          INDEX idx_active (active)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
    } catch (createError: any) {
      // Table might already exist, that's fine
      if (createError?.code !== 'ER_TABLE_EXISTS_ERROR') {
        console.error('Error ensuring ip_whitelist table exists:', createError);
      }
    }

    // Check if IP already exists in database
    const existing = await executeQuery<any>(
      'SELECT id FROM ip_whitelist WHERE ip = ?',
      [ip.trim()]
    );

    if (existing.length > 0) {
      return NextResponse.json({ error: 'IP address already in whitelist' }, { status: 409 });
    }

    // Generate unique ID
    const id = `ip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Insert into database
    await executeSingleQuery(
      `INSERT INTO ip_whitelist (id, ip, description, created_by, active)
       VALUES (?, ?, ?, ?, ?)`,
      [id, ip.trim(), description || '', decoded.email || 'admin', true]
    );

    // Fetch the created entry
    const newEntry = await executeQuery<any>(
      `SELECT id, ip, description, created_at as createdAt, created_by as createdBy, active
       FROM ip_whitelist WHERE id = ?`,
      [id]
    );

    const entry = {
      ...newEntry[0],
      createdAt: newEntry[0].createdAt ? new Date(newEntry[0].createdAt).toISOString() : new Date().toISOString(),
      active: Boolean(newEntry[0].active)
    };

    return NextResponse.json({
      success: true,
      message: 'IP added to whitelist',
      entry
    });
  } catch (error: any) {
    console.error('Error adding IP to whitelist:', error);
    return NextResponse.json(
      { error: 'Failed to add IP to whitelist' },
      { status: 500 }
    );
  }
}

