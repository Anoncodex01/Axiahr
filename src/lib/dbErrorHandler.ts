import { NextResponse } from 'next/server';

/**
 * Check if an error is a database connection error
 */
export function isDatabaseConnectionError(error: any): boolean {
  const errorMessage = error?.message || error?.code || '';
  const connectionErrors = [
    'ECONNREFUSED',
    'ETIMEDOUT',
    'ENOTFOUND',
    'ECONNRESET',
    'PROTOCOL_CONNECTION_LOST',
    'PROTOCOL_ENQUEUE_AFTER_QUIT',
    'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR',
    'Connection lost',
    'Connection closed',
    'Unable to connect',
    'DB_CONNECTION_ERROR',
    'Database service is temporarily unavailable'
  ];
  return connectionErrors.some(err => 
    errorMessage.includes(err) || 
    error?.code === err ||
    (error as any)?.code === 'DB_CONNECTION_ERROR'
  );
}

/**
 * Handle database errors in API routes
 * Returns a user-friendly error response
 */
export function handleDatabaseError(error: any): NextResponse {
  console.error('Database error:', error);
  
  if (isDatabaseConnectionError(error)) {
    return NextResponse.json(
      {
        error: 'Database service is temporarily unavailable. Please try again in a few moments.',
        code: 'DB_CONNECTION_ERROR',
        retryable: true
      },
      { status: 503 } // Service Unavailable
    );
  }
  
  // Handle other database errors
  if (error?.code === 'ER_DUP_ENTRY') {
    return NextResponse.json(
      { error: 'A record with this information already exists' },
      { status: 409 }
    );
  }
  
  if (error?.code === 'ER_BAD_FIELD_ERROR' || error?.code === 'ER_NO_SUCH_TABLE') {
    return NextResponse.json(
      { 
        error: 'Database configuration error. Please contact support.',
        code: error.code
      },
      { status: 500 }
    );
  }
  
  // Generic database error
  return NextResponse.json(
    {
      error: error?.message || 'Database operation failed. Please try again.',
      code: error?.code,
      details: process.env.NODE_ENV === 'development' ? error?.message : undefined
    },
    { status: 500 }
  );
}

