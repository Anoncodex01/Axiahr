import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { readFileSync } from 'fs';
import { join } from 'path';

// This endpoint is called by middleware or route handlers to check IP whitelist
// Since middleware runs in Edge Runtime, we use this API route for file-based whitelist

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ip } = body;

    if (!ip) {
      return NextResponse.json({ error: 'IP address required' }, { status: 400 });
    }

    // Load whitelist from file
    let whitelist: any[] = [];
    try {
      const whitelistFile = join(process.cwd(), 'data', 'ip-whitelist.json');
      const data = readFileSync(whitelistFile, 'utf-8');
      whitelist = JSON.parse(data).filter((entry: any) => entry.active);
    } catch (error) {
      // File doesn't exist - whitelist disabled (allow all)
      return NextResponse.json({ allowed: true, reason: 'whitelist_disabled' });
    }

    // If whitelist is empty, allow all
    if (whitelist.length === 0) {
      return NextResponse.json({ allowed: true, reason: 'whitelist_empty' });
    }

    // Check if IP matches any whitelist entry
    const isAllowed = whitelist.some(entry => {
      if (ip === entry.ip) return true;
      
      // Check CIDR notation
      if (entry.ip.includes('/')) {
        const [network, prefixLength] = entry.ip.split('/');
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

