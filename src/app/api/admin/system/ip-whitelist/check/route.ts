import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';

/**
 * Check if an IP is whitelisted
 * This endpoint is used by middleware to check IP whitelist
 * Since middleware runs in Edge Runtime, we use this API route
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ip } = body;

    if (!ip) {
      return NextResponse.json({ error: 'IP address required' }, { status: 400 });
    }

    // Get active whitelist entries from database
    let whitelist: any[] = [];
    try {
      whitelist = await executeQuery<any>(
        'SELECT ip FROM ip_whitelist WHERE active = TRUE',
        []
      );
    } catch (error: any) {
      // Table doesn't exist - whitelist disabled (allow all)
      if (error?.code === 'ER_NO_SUCH_TABLE') {
        return NextResponse.json({ allowed: true, reason: 'whitelist_disabled' });
      }
      throw error;
    }

    // If whitelist is empty, allow all
    if (whitelist.length === 0) {
      return NextResponse.json({ allowed: true, reason: 'whitelist_empty' });
    }

    // Check if IP matches any whitelist entry
    const isAllowed = whitelist.some(entry => {
      const whitelistedIP = entry.ip;
      
      if (ip === whitelistedIP) return true;
      
      // Check CIDR notation
      if (whitelistedIP.includes('/')) {
        const [network, prefixLength] = whitelistedIP.split('/');
        const prefix = parseInt(prefixLength);
        
        const ipParts = ip.split('.').map(Number);
        const networkParts = network.split('.').map(Number);
        
        if (prefix === 24) {
          return ipParts[0] === networkParts[0] && 
                 ipParts[1] === networkParts[1] && 
                 ipParts[2] === networkParts[2];
        } else if (prefix === 16) {
          return ipParts[0] === networkParts[0] && 
                 ipParts[1] === networkParts[1];
        } else if (prefix === 8) {
          return ipParts[0] === networkParts[0];
        }
      }
      
      return false;
    });

    return NextResponse.json({
      allowed: isAllowed,
      reason: isAllowed ? 'ip_whitelisted' : 'ip_not_whitelisted'
    });
  } catch (error: any) {
    console.error('Error checking IP whitelist:', error);
    // On error, allow access (fail open) - you may want to change this
    return NextResponse.json({ allowed: true, reason: 'error_checking' });
  }
}

