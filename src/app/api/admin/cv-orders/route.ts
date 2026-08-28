import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { verifyToken } from '@/lib/auth';

// GET /api/admin/cv-orders - Get all CV orders for admin panel
export async function GET(request: NextRequest) {
  try {
    console.log('📥 CV Orders API - Request received');
    
    // Get token for authentication - prioritize Authorization header (explicitly sent by frontend)
    const authHeader = request.headers.get('authorization')?.replace('Bearer ', '');
    const adminAuthTokenCookie = request.cookies.get('adminAuthToken')?.value;
    const axiaAdminTokenCookie = request.cookies.get('axia_admin_token')?.value;
    const authTokenCookie = request.cookies.get('authToken')?.value; // May be candidate token
    
    // Prioritize Authorization header (explicitly sent), then admin cookies, then fallback
    const token = authHeader || adminAuthTokenCookie || axiaAdminTokenCookie || authTokenCookie;

    console.log('🔑 CV Orders API - Token check:', {
      hasAuthTokenCookie: !!authTokenCookie,
      hasAxiaAdminTokenCookie: !!axiaAdminTokenCookie,
      hasAuthHeader: !!authHeader,
      hasToken: !!token
    });

    if (!token) {
      console.error('❌ CV Orders API - No token found');
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify token
    let decoded: any;
    try {
      decoded = verifyToken(token);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const userRole = decoded.role || decoded.type;
    console.log('🔍 CV Orders API - User role check:', {
      userRole,
      decodedKeys: Object.keys(decoded),
      hasRole: !!decoded.role,
      hasType: !!decoded.type
    });
    
    if (userRole !== 'admin' && userRole !== 'super_admin') {
      console.error('❌ CV Orders API - Access denied:', userRole);
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }
    
    console.log('✅ CV Orders API - Admin access granted');

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const paymentStatus = searchParams.get('payment_status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query = `
      SELECT 
        co.id,
        co.candidate_id,
        co.amount_tzs,
        co.amount_usd,
        co.currency,
        co.payment_status,
        co.payment_method,
        co.payment_reference,
        co.stripe_session_id,
        co.cv_file_path,
        co.processed_cv_path,
        co.status,
        co.created_at,
        co.paid_at,
        co.completed_at,
        co.updated_at,
        c.first_name,
        c.surname,
        c.email,
        c.phone
      FROM cv_orders co
      LEFT JOIN candidates c ON co.candidate_id = c.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status) {
      query += ` AND co.status = ?`;
      params.push(status);
    }

    if (paymentStatus) {
      query += ` AND co.payment_status = ?`;
      params.push(paymentStatus);
    }

    query += ` ORDER BY co.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    console.log('📊 CV Orders API - Executing query:', {
      query: query.substring(0, 200) + '...',
      params: params.slice(0, -2) // Exclude limit and offset for logging
    });
    
    const orders = await executeQuery(query, params);
    
    console.log('📊 CV Orders API - Query results:', {
      ordersCount: orders.length,
      sampleOrder: orders.length > 0 ? orders[0] : null
    });

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM cv_orders co
      WHERE 1=1
    `;
    const countParams: any[] = [];

    if (status) {
      countQuery += ` AND co.status = ?`;
      countParams.push(status);
    }

    if (paymentStatus) {
      countQuery += ` AND co.payment_status = ?`;
      countParams.push(paymentStatus);
    }

    const countResult = await executeQuery(countQuery, countParams);
    let total = 0;
    if (countResult && countResult.length > 0) {
      total = typeof countResult[0].total === 'number' 
        ? countResult[0].total 
        : parseInt(String(countResult[0].total || '0'));
    }

    console.log('📊 CV Orders API - Query results:', {
      ordersCount: orders.length,
      total: total,
      limit,
      offset,
      hasStatusFilter: !!status,
      hasPaymentStatusFilter: !!paymentStatus,
      sampleOrder: orders.length > 0 ? orders[0] : null
    });

    const formattedOrders = orders.map((order: any) => ({
      id: order.id,
      candidateId: order.candidate_id,
      candidateName: order.first_name && order.surname 
        ? `${order.first_name} ${order.surname}`.trim()
        : order.first_name || order.surname || `Candidate #${order.candidate_id}`,
      candidateEmail: order.email,
      candidatePhone: order.phone,
      amountTZS: parseFloat(order.amount_tzs),
      amountUSD: parseFloat(order.amount_usd),
      currency: order.currency,
      paymentStatus: order.payment_status,
      paymentMethod: order.payment_method,
      paymentReference: order.payment_reference,
      stripeSessionId: order.stripe_session_id,
      cvFilePath: order.cv_file_path,
      processedCvPath: order.processed_cv_path,
      status: order.status,
      createdAt: order.created_at,
      paidAt: order.paid_at,
      completedAt: order.completed_at,
      updatedAt: order.updated_at,
      canUpload: order.payment_status === 'completed' && !order.cv_file_path,
      hasProcessedCv: !!order.processed_cv_path
    }));

    return NextResponse.json({
      success: true,
      orders: formattedOrders,
      total,
      limit,
      offset
    });

  } catch (error: any) {
    console.error('❌ Error getting CV orders:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to get CV orders' 
      },
      { status: 500 }
    );
  }
}

