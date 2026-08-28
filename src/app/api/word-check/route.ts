import { NextRequest, NextResponse } from 'next/server';
import { checkForBarredWords, getWordCheckSummary } from '@/utils/wordChecker';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { description, requirements, benefits } = body;

    // Check each field
    const descriptionResult = checkForBarredWords(description || '');
    const requirementsResult = checkForBarredWords(requirements || '');
    const benefitsResult = checkForBarredWords(benefits || '');

    // Get combined results
    const summary = getWordCheckSummary([descriptionResult, requirementsResult, benefitsResult]);

    return NextResponse.json({
      success: true,
      hasBarredWords: summary.hasBarredWords,
      foundWords: summary.foundWords,
      warnings: summary.warnings,
      fieldResults: {
        description: descriptionResult,
        requirements: requirementsResult,
        benefits: benefitsResult
      }
    });
  } catch (error) {
    console.error('Word check API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check words' },
      { status: 500 }
    );
  }
}
