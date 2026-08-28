import { NextRequest, NextResponse } from 'next/server';
import { getPoolStats, testConnection } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    // Test database connection
    const isConnected = await testConnection();
    
    // Get pool statistics
    const poolStats = getPoolStats();
    
    // Calculate connection usage percentage
    const usagePercentage = poolStats.totalConnections > 0 
      ? Math.round((poolStats.activeConnections / poolStats.totalConnections) * 100)
      : 0;
    
    // Determine health status
    let healthStatus = 'healthy';
    if (usagePercentage > 80) {
      healthStatus = 'warning';
    } else if (usagePercentage > 95 || !isConnected) {
      healthStatus = 'critical';
    }
    
    return NextResponse.json({
      success: true,
      data: {
        connection: {
          status: isConnected ? 'connected' : 'disconnected',
          health: healthStatus
        },
        pool: {
          ...poolStats,
          usagePercentage,
          status: healthStatus
        },
        recommendations: getRecommendations(poolStats, usagePercentage)
      }
    });
    
  } catch (error) {
    console.error('Database status check error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to check database status',
        data: {
          connection: { status: 'error', health: 'critical' },
          pool: { status: 'error' }
        }
      },
      { status: 500 }
    );
  }
}

function getRecommendations(stats: any, usagePercentage: number): string[] {
  const recommendations: string[] = [];
  
  if (usagePercentage > 80) {
    recommendations.push('Consider increasing connectionLimit in database config');
    recommendations.push('Check for connection leaks in application code');
  }
  
  if (stats.activeConnections > 15) {
    recommendations.push('Monitor for long-running queries');
    recommendations.push('Consider query optimization');
  }
  
  if (stats.idleConnections > 10) {
    recommendations.push('Consider reducing connectionLimit if idle connections are high');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Database connection pool is operating normally');
  }
  
  return recommendations;
}
