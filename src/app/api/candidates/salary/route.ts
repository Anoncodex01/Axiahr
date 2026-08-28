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

    // Get salary information for the candidate
    const salary = await executeQuery(
      'SELECT * FROM candidate_salary WHERE candidate_id = ?',
      [candidateId]
    );

    return NextResponse.json({
      success: true,
      data: salary.length > 0 ? salary[0] : null
    });

  } catch (error) {
    console.error('Error fetching salary information:', error);
    return NextResponse.json(
      { error: 'Failed to fetch salary information' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { candidateId, salaryData } = body;

    if (!candidateId || !salaryData) {
      return NextResponse.json(
        { error: 'Candidate ID and salary data are required' },
        { status: 400 }
      );
    }

    // Check if salary record already exists
    const existingSalary = await executeQuery(
      'SELECT id FROM candidate_salary WHERE candidate_id = ?',
      [candidateId]
    );

    if (existingSalary.length > 0) {
      // Update existing salary record
      await executeSingleQuery(
        `UPDATE candidate_salary SET 
         expected_salary = ?, 
         currency = ?, 
         salary_type = ?, 
         is_negotiable = ?, 
         benefits = ?, 
         notice_period = ?, 
         updated_at = NOW() 
         WHERE candidate_id = ?`,
        [
          salaryData.expected_salary,
          salaryData.currency,
          salaryData.salary_type,
          salaryData.is_negotiable,
          salaryData.benefits || null,
          salaryData.notice_period || null,
          candidateId
        ]
      );
    } else {
      // Insert new salary record
      await executeSingleQuery(
        `INSERT INTO candidate_salary 
         (candidate_id, expected_salary, currency, salary_type, is_negotiable, benefits, notice_period, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          candidateId,
          salaryData.expected_salary,
          salaryData.currency,
          salaryData.salary_type,
          salaryData.is_negotiable,
          salaryData.benefits || null,
          salaryData.notice_period || null
        ]
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Salary information saved successfully'
    });

  } catch (error) {
    console.error('Error saving salary information:', error);
    return NextResponse.json(
      { error: 'Failed to save salary information' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { candidateId, salaryData } = body;

    if (!candidateId || !salaryData) {
      return NextResponse.json(
        { error: 'Candidate ID and salary data are required' },
        { status: 400 }
      );
    }

    // Update salary information
    await executeSingleQuery(
      `UPDATE candidate_salary SET 
       expected_salary = ?, 
       currency = ?, 
       salary_type = ?, 
       is_negotiable = ?, 
       benefits = ?, 
       notice_period = ?, 
       updated_at = NOW() 
       WHERE candidate_id = ?`,
      [
        salaryData.expected_salary,
        salaryData.currency,
        salaryData.salary_type,
        salaryData.is_negotiable,
        salaryData.benefits || null,
        salaryData.notice_period || null,
        candidateId
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Salary information updated successfully'
    });

  } catch (error) {
    console.error('Error updating salary information:', error);
    return NextResponse.json(
      { error: 'Failed to update salary information' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const candidateId = searchParams.get('candidateId');

    if (!candidateId) {
      return NextResponse.json(
        { error: 'Candidate ID is required' },
        { status: 400 }
      );
    }

    // Delete salary information
    await executeSingleQuery(
      'DELETE FROM candidate_salary WHERE candidate_id = ?',
      [candidateId]
    );

    return NextResponse.json({
      success: true,
      message: 'Salary information deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting salary information:', error);
    return NextResponse.json(
      { error: 'Failed to delete salary information' },
      { status: 500 }
    );
  }
}
