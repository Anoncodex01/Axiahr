import { NextRequest, NextResponse } from 'next/server';

// GET /api/cv-builder/exchange-rate - Get current TZS to USD exchange rate
export async function GET(request: NextRequest) {
  try {
    // Get exchange rate from environment variable
    const TZS_TO_USD_RATE = parseFloat(process.env.TZS_TO_USD_RATE || '2678');
    
    return NextResponse.json({
      success: true,
      rate: TZS_TO_USD_RATE,
      amountTZS: 50000,
      amountUSD: 50000 / TZS_TO_USD_RATE
    });
  } catch (error: any) {
    console.error('Error getting exchange rate:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to get exchange rate',
        rate: 2678 // Default fallback
      },
      { status: 500 }
    );
  }
}

