// Designations utility for reading from All_Designations.csv

// Cache for designations
let designationsCache: string[] | null = null;
let loadedAt: number | null = null;

const TTL_MS = 15 * 60 * 1000; // 15 minutes

// Parse CSV content to extract designations
function parseDesignationsCSV(csv: string): string[] {
  const designations: string[] = [];
  const lines = csv.split('\n').filter(line => line.trim().length > 0);
  
  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line && !line.startsWith('---') && line !== 'Designation') {
      // Clean up the designation name
      const designation = line.replace(/^["']|["']$/g, '').trim();
      if (designation && designation.length > 0) {
        designations.push(designation);
      }
    }
  }
  
  return designations;
}

// Load designations from CSV API
export async function loadDesignations(opts?: { forceReload?: boolean }): Promise<string[]> {
  // Check cache first
  if (!opts?.forceReload && designationsCache && loadedAt && (Date.now() - loadedAt) < TTL_MS) {
    return designationsCache;
  }

  try {
    console.log('Loading designations from CSV...');
    const response = await fetch('/All_Designations.csv');
    
    if (!response.ok) {
      throw new Error(`Failed to load designations: ${response.status}`);
    }
    
    const csvContent = await response.text();
    const designations = parseDesignationsCSV(csvContent);
    
    console.log('Loaded designations:', designations.length);
    
    // Cache the results
    designationsCache = designations;
    loadedAt = Date.now();
    
    return designations;
  } catch (error) {
    console.error('Error loading designations:', error);
    // Return empty array as fallback
    return [];
  }
}

// Search designations with a query
export function searchDesignations(designations: string[], query: string): string[] {
  if (!query.trim()) return designations.slice(0, 50); // Return first 50 if no query
  
  const lowercaseQuery = query.toLowerCase();
  return designations
    .filter(designation => 
      designation.toLowerCase().includes(lowercaseQuery)
    )
    .slice(0, 50); // Limit to 50 results
}

// Get all designations (cached)
export async function getAllDesignations(): Promise<string[]> {
  return await loadDesignations();
}
