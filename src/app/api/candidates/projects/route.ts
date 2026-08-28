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

    // Get all projects for the candidate
    const projects = await executeQuery(
      'SELECT * FROM candidate_projects WHERE candidate_id = ? ORDER BY start_date DESC',
      [candidateId]
    );

    return NextResponse.json({
      success: true,
      data: projects
    });

  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { candidateId, projectData } = body;

    if (!candidateId || !projectData) {
      return NextResponse.json(
        { error: 'Candidate ID and project data are required' },
        { status: 400 }
      );
    }

    // Insert new project
    const result = await executeSingleQuery(
      `INSERT INTO candidate_projects 
       (candidate_id, title, client, start_date, end_date, description, tools_technologies) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        candidateId,
        projectData.title,
        projectData.client || null,
        projectData.startDate || null,
        projectData.endDate || null,
        projectData.description || null,
        projectData.toolsTechnologies || null
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Project added successfully',
      data: { id: result.insertId }
    });

  } catch (error) {
    console.error('Error adding project:', error);
    return NextResponse.json(
      { error: 'Failed to add project' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, projectData } = body;

    if (!projectId || !projectData) {
      return NextResponse.json(
        { error: 'Project ID and project data are required' },
        { status: 400 }
      );
    }

    // Update existing project
    await executeSingleQuery(
      `UPDATE candidate_projects SET 
       title = ?, client = ?, start_date = ?, end_date = ?, 
       description = ?, tools_technologies = ?, updated_at = NOW() 
       WHERE id = ?`,
      [
        projectData.title,
        projectData.client || null,
        projectData.startDate || null,
        projectData.endDate || null,
        projectData.description || null,
        projectData.toolsTechnologies || null,
        projectId
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Project updated successfully'
    });

  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    // Delete project
    await executeSingleQuery(
      'DELETE FROM candidate_projects WHERE id = ?',
      [projectId]
    );

    return NextResponse.json({
      success: true,
      message: 'Project deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}
