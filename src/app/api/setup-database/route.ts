import { NextRequest, NextResponse } from 'next/server';
import { setupCandidateTables, cleanupExpiredCandidateOTPs } from '@/lib/setup-database';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Initializing database tables...');
    
    // Setup candidate tables
    await setupCandidateTables();
    
    // Clean up expired OTPs
    await cleanupExpiredCandidateOTPs();
    
    return NextResponse.json({
      success: true,
      message: 'Database tables initialized successfully'
    });

  } catch (error) {
    console.error('❌ Database setup error:', error);
    return NextResponse.json(
      { error: 'Failed to initialize database' },
      { status: 500 }
    );
  }
}
