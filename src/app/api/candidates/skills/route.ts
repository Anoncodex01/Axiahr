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

    // Get all skills for the candidate
    const skills = await executeQuery(
      'SELECT * FROM candidate_skills WHERE candidate_id = ? ORDER BY created_at DESC',
      [candidateId]
    );

    return NextResponse.json({
      success: true,
      data: skills
    });

  } catch (error) {
    console.error('Error fetching skills:', error);
    return NextResponse.json(
      { error: 'Failed to fetch skills' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { candidateId, skillName } = body;

    if (!candidateId || !skillName) {
      return NextResponse.json(
        { error: 'Candidate ID and skill name are required' },
        { status: 400 }
      );
    }

    // Check if skill already exists
    const existing = await executeQuery(
      'SELECT id FROM candidate_skills WHERE candidate_id = ? AND skill_name = ?',
      [candidateId, skillName]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Skill already exists' },
        { status: 400 }
      );
    }

    // Insert new skill
    const result = await executeSingleQuery(
      'INSERT INTO candidate_skills (candidate_id, skill_name) VALUES (?, ?)',
      [candidateId, skillName]
    );

    return NextResponse.json({
      success: true,
      message: 'Skill added successfully',
      data: { id: result.insertId }
    });

  } catch (error) {
    console.error('Error adding skill:', error);
    return NextResponse.json(
      { error: 'Failed to add skill' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const skillId = searchParams.get('skillId');

    if (!skillId) {
      return NextResponse.json(
        { error: 'Skill ID is required' },
        { status: 400 }
      );
    }

    // Delete skill
    await executeSingleQuery(
      'DELETE FROM candidate_skills WHERE id = ?',
      [skillId]
    );

    return NextResponse.json({
      success: true,
      message: 'Skill deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting skill:', error);
    return NextResponse.json(
      { error: 'Failed to delete skill' },
      { status: 500 }
    );
  }
}
