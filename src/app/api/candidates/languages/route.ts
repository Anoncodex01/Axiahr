import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeSingleQuery } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const candidateId = searchParams.get('candidateId');

    if (!candidateId) {
      return NextResponse.json(
        { error: 'Candidate ID is required' },
        { status: 400 }
      );
    }

    // Get all languages for the candidate
    const languages = await executeQuery(
      'SELECT * FROM candidate_languages WHERE candidate_id = ? ORDER BY created_at DESC',
      [candidateId]
    );

    return NextResponse.json({
      success: true,
      data: languages
    });

  } catch (error) {
    console.error('Error fetching languages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch languages' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { candidateId, languageData } = body;

    if (!candidateId || !languageData) {
      return NextResponse.json(
        { error: 'Candidate ID and language data are required' },
        { status: 400 }
      );
    }

    // Insert new language
    const result = await executeSingleQuery(
      `INSERT INTO candidate_languages 
       (candidate_id, language_name, proficiency_level, certification, is_native, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        candidateId,
        languageData.languageName || languageData.language_name,
        languageData.proficiencyLevel || languageData.proficiency_level,
        languageData.certification || null,
        languageData.isNative || languageData.is_native || false
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Language added successfully',
      data: { id: result.insertId }
    });

  } catch (error) {
    console.error('Error adding language:', error);
    return NextResponse.json(
      { error: 'Failed to add language' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { languageId, languageData } = body;

    if (!languageId || !languageData) {
      return NextResponse.json(
        { error: 'Language ID and language data are required' },
        { status: 400 }
      );
    }

    // Update existing language
    await executeSingleQuery(
      `UPDATE candidate_languages SET 
       language_name = ?, 
       proficiency_level = ?, 
       certification = ?, 
       is_native = ?, 
       updated_at = NOW() 
       WHERE id = ?`,
      [
        languageData.languageName || languageData.language_name,
        languageData.proficiencyLevel || languageData.proficiency_level,
        languageData.certification || null,
        languageData.isNative || languageData.is_native || false,
        languageId
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Language updated successfully'
    });

  } catch (error) {
    console.error('Error updating language:', error);
    return NextResponse.json(
      { error: 'Failed to update language' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const languageId = searchParams.get('languageId');

    if (!languageId) {
      return NextResponse.json(
        { error: 'Language ID is required' },
        { status: 400 }
      );
    }

    // Delete language
    await executeSingleQuery(
      'DELETE FROM candidate_languages WHERE id = ?',
      [languageId]
    );

    return NextResponse.json({
      success: true,
      message: 'Language deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting language:', error);
    return NextResponse.json(
      { error: 'Failed to delete language' },
      { status: 500 }
    );
  }
}
