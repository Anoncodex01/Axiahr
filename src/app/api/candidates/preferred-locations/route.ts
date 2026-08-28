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

    const locations = await executeQuery(
      'SELECT * FROM candidate_preferred_locations WHERE candidate_id = ? ORDER BY display_order ASC',
      [candidateId]
    );

    return NextResponse.json({
      success: true,
      data: locations
    });
  } catch (error) {
    console.error('Error fetching preferred locations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preferred locations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { candidateId, locations } = body;

    if (!candidateId || !Array.isArray(locations)) {
      return NextResponse.json(
        { error: 'Candidate ID and locations array are required' },
        { status: 400 }
      );
    }

    // Delete existing preferred locations
    await executeSingleQuery(
      'DELETE FROM candidate_preferred_locations WHERE candidate_id = ?',
      [candidateId]
    );

    // Insert new preferred locations
    if (locations.length > 0) {
      const insertValues = locations.map((loc: any, index: number) => {
        // Build location_string from city, state, country
        let locationString = '';
        if (loc.city && loc.state) {
          locationString = `${loc.city}, ${loc.state}, ${loc.country}`;
        } else if (loc.state) {
          locationString = `${loc.state}, ${loc.country}`;
        } else {
          locationString = loc.country;
        }

        return [
          candidateId,
          locationString,
          loc.city || null,
          loc.state || null,
          loc.country || null,
          loc.display_order !== undefined ? loc.display_order : index
        ];
      });

      const placeholders = insertValues.map(() => '(?, ?, ?, ?, ?, ?)').join(', ');
      const flatValues = insertValues.flat();

      await executeSingleQuery(
        `INSERT INTO candidate_preferred_locations 
         (candidate_id, location_string, city, state, country, display_order) 
         VALUES ${placeholders}`,
        flatValues
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Preferred locations saved successfully'
    });
  } catch (error) {
    console.error('Error saving preferred locations:', error);
    return NextResponse.json(
      { error: 'Failed to save preferred locations' },
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

    await executeSingleQuery(
      'DELETE FROM candidate_preferred_locations WHERE candidate_id = ?',
      [candidateId]
    );

    return NextResponse.json({
      success: true,
      message: 'Preferred locations deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting preferred locations:', error);
    return NextResponse.json(
      { error: 'Failed to delete preferred locations' },
      { status: 500 }
    );
  }
}

