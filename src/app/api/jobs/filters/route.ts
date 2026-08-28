import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';

// GET - Get filter options from actual jobs in database
export async function GET(request: NextRequest) {
  try {
    // Get unique values for each filter category
    const [employmentTypes, experienceLevels, educationLevels, regions, countries] = await Promise.all([
      // Employment Types
      executeQuery<any>(
        `SELECT DISTINCT employment_type, COUNT(*) as count
         FROM jobs
         WHERE status = 'published' AND employment_type IS NOT NULL
           AND (deadline IS NULL OR deadline >= CURDATE())
           AND (closing_date IS NULL OR closing_date >= CURDATE())
         GROUP BY employment_type
         ORDER BY count DESC`
      ),
      // Experience Levels
      executeQuery<any>(
        `SELECT DISTINCT experience_level, COUNT(*) as count
         FROM jobs
         WHERE status = 'published' AND experience_level IS NOT NULL
           AND (deadline IS NULL OR deadline >= CURDATE())
           AND (closing_date IS NULL OR closing_date >= CURDATE())
         GROUP BY experience_level
         ORDER BY count DESC`
      ),
      // Education Levels
      executeQuery<any>(
        `SELECT DISTINCT education, COUNT(*) as count
         FROM jobs
         WHERE status = 'published' AND education IS NOT NULL AND education != ''
           AND (deadline IS NULL OR deadline >= CURDATE())
           AND (closing_date IS NULL OR closing_date >= CURDATE())
         GROUP BY education
         ORDER BY count DESC`
      ),
      // Regions
      executeQuery<any>(
        `SELECT DISTINCT region, COUNT(*) as count
         FROM jobs
         WHERE status = 'published' AND region IS NOT NULL AND region != ''
           AND (deadline IS NULL OR deadline >= CURDATE())
           AND (closing_date IS NULL OR closing_date >= CURDATE())
         GROUP BY region
         ORDER BY count DESC
         LIMIT 20`
      ),
      // Countries
      executeQuery<any>(
        `SELECT DISTINCT country, COUNT(*) as count
         FROM jobs
         WHERE status = 'published' AND country IS NOT NULL AND country != ''
           AND (deadline IS NULL OR deadline >= CURDATE())
           AND (closing_date IS NULL OR closing_date >= CURDATE())
         GROUP BY country
         ORDER BY count DESC
         LIMIT 10`
      )
    ]);

    // Format employment types (convert full_time to full-time for display)
    const formattedEmploymentTypes = employmentTypes.map((item: any) => ({
      value: item.employment_type?.replace('_', '-') || item.employment_type,
      label: item.employment_type?.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || item.employment_type,
      count: item.count || 0
    }));

    // Format experience levels
    const formattedExperienceLevels = experienceLevels.map((item: any) => ({
      value: item.experience_level?.toLowerCase() || item.experience_level,
      label: item.experience_level || '',
      count: item.count || 0
    }));

    // Format education levels
    const formattedEducationLevels = educationLevels.map((item: any) => ({
      value: item.education?.toLowerCase() || item.education,
      label: item.education || '',
      count: item.count || 0
    }));

    // Format regions
    const formattedRegions = regions.map((item: any) => ({
      value: item.region,
      label: item.region,
      count: item.count || 0
    }));

    // Format countries
    const formattedCountries = countries.map((item: any) => ({
      value: item.country,
      label: item.country,
      count: item.count || 0
    }));

    return NextResponse.json({
      success: true,
      filters: {
        employmentTypes: formattedEmploymentTypes,
        experienceLevels: formattedExperienceLevels,
        educationLevels: formattedEducationLevels,
        regions: formattedRegions,
        countries: formattedCountries
      }
    });

  } catch (error: any) {
    console.error('Error fetching filter options:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch filter options', details: error?.message },
      { status: 500 }
    );
  }
}
