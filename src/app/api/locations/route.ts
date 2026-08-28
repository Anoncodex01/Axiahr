import { NextResponse } from 'next/server';
import { locationData } from '@/utils/locationData';

export async function GET() {
  try {
    return NextResponse.json({
      countries: locationData.countries,
      message: 'Location data loaded successfully'
    }, { 
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      }
    });
  } catch (error) {
    console.error('Error loading location data:', error);
    return NextResponse.json({ error: 'Failed to load location data' }, { status: 500 });
  }
}
