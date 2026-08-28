import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeSingleQuery } from '@/lib/database';

/**
 * Check if the users table exists and create it if it doesn't
 * This is a helper endpoint to ensure the database is set up correctly
 */
export async function GET(request: NextRequest) {
  try {
    // Check if users table exists
    try {
      await executeQuery('SELECT 1 FROM users LIMIT 1');
      return NextResponse.json({
        success: true,
        message: 'Users table exists',
        tableExists: true
      });
    } catch (error: any) {
      // Table doesn't exist, create it
      if (error?.code === 'ER_NO_SUCH_TABLE' || error?.message?.includes('doesn\'t exist')) {
        try {
          await executeSingleQuery(`
            CREATE TABLE IF NOT EXISTS users (
              id INT AUTO_INCREMENT PRIMARY KEY,
              first_name VARCHAR(100) NOT NULL,
              last_name VARCHAR(100) NOT NULL,
              email VARCHAR(255) UNIQUE NOT NULL,
              password_hash VARCHAR(255) NOT NULL,
              role ENUM('super_admin', 'admin', 'hr_manager', 'recruiter', 'candidate_manager', 'employer_manager', 'content_moderator') NOT NULL,
              permissions JSON,
              department VARCHAR(100),
              status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
              last_login TIMESTAMP NULL,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
          `);
          
          return NextResponse.json({
            success: true,
            message: 'Users table created successfully',
            tableExists: false,
            tableCreated: true
          });
        } catch (createError: any) {
          return NextResponse.json({
            success: false,
            error: 'Failed to create users table',
            details: createError?.message || 'Unknown error'
          }, { status: 500 });
        }
      }
      
      // Other database errors
      throw error;
    }
  } catch (error: any) {
    console.error('Database check error:', error);
    return NextResponse.json({
      success: false,
      error: 'Database check failed',
      details: error?.message || 'Unknown error',
      code: error?.code
    }, { status: 500 });
  }
}

