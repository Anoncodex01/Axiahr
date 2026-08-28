import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { checkSystemAlerts, getActiveAlerts } from '@/lib/alertChecker';

interface Alert {
  id: string;
  priority: 'P0' | 'P1' | 'P2';
  title: string;
  message: string;
  timestamp: string;
  acknowledged: boolean;
  resolved: boolean;
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('adminAuthToken')?.value || 
                  request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify token
    const decoded = verifyToken(token);
    if (decoded.type !== 'admin' || decoded.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden - Super admin only' }, { status: 403 });
    }

    // Generate new alerts based on current system state
    await checkSystemAlerts();
    
    // Get all active alerts
    const alerts = getActiveAlerts();

    // Return alerts sorted by priority and timestamp
    const sortedAlerts = alerts.sort((a, b) => {
      const priorityOrder = { P0: 0, P1: 1, P2: 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    return NextResponse.json({
      success: true,
      alerts: sortedAlerts
    });
  } catch (error: any) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alerts' },
      { status: 500 }
    );
  }
}

