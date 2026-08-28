// Utilities to load and search qualifications from CSV served at /api/qualifications
// CSV format: Category,Qualification / Course Name,Possible Specializations / Fields

export interface Qualification {
  category: string;
  qualification: string;
  specializations: string[];
}

// Cache for qualifications
let qualificationsCache: Qualification[] | null = null;
let loadedAt: number | null = null;

const TTL_MS = 15 * 60 * 1000; // 15 minutes

// Parse CSV content
function parseQualificationsCSV(csv: string): Qualification[] {
  const qualifications: Qualification[] = [];
  const lines = csv.split('\n').filter(line => line.trim().length > 0);
  
  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line) {
      // Parse CSV line properly handling quoted values
      const parts = parseCSVLine(line);
      if (parts.length >= 3) {
        const [category, qualification, specializationsStr] = parts;
        const specializations = specializationsStr
          .split(',')
          .map(s => s.trim())
          .filter(s => s.length > 0);
        
        qualifications.push({
          category,
          qualification,
          specializations
        });
      }
    }
  }
  
  return qualifications;
}

// Helper function to parse CSV line with proper quote handling
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  // Add the last part
  if (current.trim()) {
    result.push(current.trim());
  }
  
  return result;
}

// Load qualifications from CSV API
export async function loadQualifications(opts?: { forceReload?: boolean }): Promise<Qualification[]> {
  const now = Date.now();
  if (!opts?.forceReload && qualificationsCache && loadedAt && now - loadedAt < TTL_MS) {
    return qualificationsCache;
  }
  
  try {
    const res = await fetch('/api/qualifications', { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const csv = await res.text();
    const qualifications = parseQualificationsCSV(csv);
    qualificationsCache = qualifications;
    loadedAt = Date.now();
    return qualifications;
  } catch (error) {
    console.error('Error loading qualifications:', error);
    // Fallback to empty array if API fails
    qualificationsCache = [];
    loadedAt = Date.now();
    return [];
  }
}

// Get all qualifications
export async function getAllQualifications(): Promise<string[]> {
  const qualifications = await loadQualifications();
  return qualifications.map(q => q.qualification);
}

// Get all specializations
export async function getAllSpecializations(): Promise<string[]> {
  const qualifications = await loadQualifications();
  const allSpecializations: string[] = [];
  
  qualifications.forEach(q => {
    allSpecializations.push(...q.specializations);
  });
  
  // Remove duplicates and sort
  return [...new Set(allSpecializations)].sort();
}

// Search qualifications
export async function searchQualifications(query: string, limit = 20): Promise<string[]> {
  const qualifications = await loadQualifications();
  const q = query.toLowerCase().trim();
  
  if (!q) {
    return qualifications.slice(0, limit).map(q => q.qualification);
  }
  
  return qualifications
    .filter(qualification => 
      qualification.qualification.toLowerCase().includes(q) ||
      qualification.category.toLowerCase().includes(q) ||
      qualification.specializations.some(spec => spec.toLowerCase().includes(q))
    )
    .slice(0, limit)
    .map(q => q.qualification);
}

// Search specializations
export async function searchSpecializations(query: string, limit = 20): Promise<string[]> {
  const qualifications = await loadQualifications();
  const q = query.toLowerCase().trim();
  
  if (!q) {
    const allSpecializations = await getAllSpecializations();
    return allSpecializations.slice(0, limit);
  }
  
  const allSpecializations = await getAllSpecializations();
  return allSpecializations
    .filter(spec => spec.toLowerCase().includes(q))
    .slice(0, limit);
}

// Get qualifications by category
export async function getQualificationsByCategory(category: string): Promise<string[]> {
  const qualifications = await loadQualifications();
  return qualifications
    .filter(q => q.category.toLowerCase() === category.toLowerCase())
    .map(q => q.qualification);
}

// Get all categories
export async function getAllCategories(): Promise<string[]> {
  const qualifications = await loadQualifications();
  const categories = qualifications.map(q => q.category);
  return [...new Set(categories)].sort();
}

// Get specializations for a specific qualification
export async function getSpecializationsForQualification(qualification: string): Promise<string[]> {
  const qualifications = await loadQualifications();
  const qual = qualifications.find(q => 
    q.qualification.toLowerCase() === qualification.toLowerCase()
  );
  
  return qual ? qual.specializations : [];
}
