import { NextRequest, NextResponse } from 'next/server';
import { locationData } from '@/utils/locationData';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const countryCode = searchParams.get('countryCode');
    
    if (!countryCode) {
      return NextResponse.json({ error: 'Country code is required' }, { status: 400 });
    }
    
    const states = locationData.getStatesByCountry(countryCode);
    
    return NextResponse.json({
      states,
      countryCode,
      count: states.length
    }, { 
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      }
    });
  } catch (error) {
    console.error('Error loading states:', error);
    return NextResponse.json({ error: 'Failed to load states' }, { status: 500 });
  }
}
