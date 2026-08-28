import { NextRequest, NextResponse } from 'next/server';
import { executeSingleQuery, executeQuery } from '@/lib/database';

// Create maintenance_mode table if it doesn't exist
async function ensureMaintenanceTable() {
  try {
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

    // Insert default row if none exists
    const existing = await executeQuery<any>('SELECT * FROM maintenance_mode LIMIT 1');
    if (existing.length === 0) {
      await executeSingleQuery(
        'INSERT INTO maintenance_mode (enabled, message) VALUES (FALSE, ?)',
        ['System is under maintenance. We will be back shortly.']
      );
    }
  } catch (error) {
    console.error('Error ensuring maintenance table:', error);
  }
}

// GET - Check maintenance status (public endpoint)
export async function GET(request: NextRequest) {
  try {
    await ensureMaintenanceTable();
    
    const result = await executeQuery<any>(
      'SELECT enabled, message, updated_at FROM maintenance_mode LIMIT 1'
    );

    if (result.length === 0) {
      return NextResponse.json({ enabled: false, message: null });
    }

    return NextResponse.json({
      enabled: Boolean(result[0].enabled),
      message: result[0].message || null,
      updatedAt: result[0].updated_at
    });
  } catch (error: any) {
    console.error('Error checking maintenance status:', error);
    // If database error, assume maintenance is off
    return NextResponse.json({ enabled: false, message: null });
  }
}

