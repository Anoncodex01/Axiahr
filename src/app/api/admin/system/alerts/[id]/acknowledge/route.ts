import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { acknowledgeAlert, getActiveAlerts } from '@/lib/alertChecker';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Await params (Next.js 15+)
    const { id } = await params;

    // Acknowledge alert
    const success = acknowledgeAlert(id);
    if (!success) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
    }

    // Get updated alert
    const alerts = getActiveAlerts();
    const alert = alerts.find(a => a.id === id);

    return NextResponse.json({
      success: true,
      alert: alert || { id, acknowledged: true }
    });
  } catch (error: any) {
    console.error('Error acknowledging alert:', error);
    return NextResponse.json(
      { error: 'Failed to acknowledge alert' },
      { status: 500 }
    );
  }
}

