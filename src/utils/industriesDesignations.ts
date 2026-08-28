interface IndustryDesignationData {
  industry: string;
  designation: string;
  level: string;
}

interface IndustriesDesignationsData {
  industries: string[];
  designations: string[];
  levels: string[];
  industryDesignationMap: { [industry: string]: { designation: string; level: string }[] };
}

let industriesDesignationsCache: IndustriesDesignationsData | null = null;

// Parse CSV line handling quoted values
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
  
  result.push(current.trim());
  return result;
}

// Parse CSV content
function parseIndustriesDesignationsCSV(csvContent: string): IndustryDesignationData[] {
  // Handle Windows line endings
  const lines = csvContent.replace(/\r\n/g, '\n').split('\n').filter(line => line.trim());
  const data: IndustryDesignationData[] = [];
  
  console.log('Total lines in CSV:', lines.length);
  
  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const columns = parseCSVLine(line);
    if (columns.length >= 2) {
      data.push({
        industry: columns[0].trim(),
        designation: columns[1].trim(),
        level: 'Mid' // Default level since CSV doesn't have level column
      });
    }
  }
  
  console.log('Parsed data entries:', data.length);
  return data;
}

// Load and cache data
export async function loadIndustriesDesignations(): Promise<IndustriesDesignationsData> {
  if (industriesDesignationsCache) {
    return industriesDesignationsCache;
  }

  try {
    console.log('Fetching industries designations from API...');
    const response = await fetch('/api/industries-designations');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('API response:', result);
    
    if (!result.data) {
      throw new Error('No data in API response');
    }
    
    const { data } = result;
    console.log('CSV data received, length:', data.length);
    
    const parsedData = parseIndustriesDesignationsCSV(data);
    console.log('Parsed data count:', parsedData.length);
    
    // Extract unique industries
    const industries = [...new Set(parsedData.map(item => item.industry))].sort();
    console.log('Unique industries:', industries.length, industries.slice(0, 5));
    
    // Extract unique designations
    const designations = [...new Set(parsedData.map(item => item.designation))].sort();
    
    // Extract unique levels
    const levels = [...new Set(parsedData.map(item => item.level))].sort();
    
    // Create industry to designations mapping
    const industryDesignationMap: { [industry: string]: { designation: string; level: string }[] } = {};
    
    parsedData.forEach(item => {
      if (!industryDesignationMap[item.industry]) {
        industryDesignationMap[item.industry] = [];
      }
      industryDesignationMap[item.industry].push({
        designation: item.designation,
        level: item.level
      });
    });
    
    industriesDesignationsCache = {
      industries,
      designations,
      levels,
      industryDesignationMap
    };
    
    return industriesDesignationsCache;
  } catch (error) {
    console.error('Error loading industries designations:', error);
    
    // Fallback with some common industries
    const fallbackIndustries = [
      'Technology',
      'Healthcare',
      'Finance',
      'Education',
      'Manufacturing',
      'Retail',
      'Real Estate',
      'Consulting',
      'Media & Entertainment',
      'Transportation',
      'Energy',
      'Government',
      'Non-profit',
      'Agriculture',
      'Construction',
      'Hospitality',
      'Telecommunications',
      'Automotive',
      'Aerospace',
      'Pharmaceuticals'
    ];
    
    return {
      industries: fallbackIndustries,
      designations: [],
      levels: ['Entry', 'Mid', 'Senior', 'Lead', 'Manager', 'Director', 'Executive'],
      industryDesignationMap: {}
    };
  }
}

// Get all industries
export async function getAllIndustries(): Promise<string[]> {
  const data = await loadIndustriesDesignations();
  return data.industries;
}

// Get designations for a specific industry
export async function getDesignationsForIndustry(industry: string): Promise<string[]> {
  const data = await loadIndustriesDesignations();
  const industryData = data.industryDesignationMap[industry] || [];
  // Return only unique designations (without levels)
  return [...new Set(industryData.map(item => item.designation))];
}

// Get all designations
export async function getAllDesignations(): Promise<string[]> {
  const data = await loadIndustriesDesignations();
  return data.designations;
}

// Get all levels
export async function getAllLevels(): Promise<string[]> {
  const data = await loadIndustriesDesignations();
  return data.levels;
}

// Search industries
export async function searchIndustries(query: string): Promise<string[]> {
  const data = await loadIndustriesDesignations();
  return data.industries.filter(industry =>
    industry.toLowerCase().includes(query.toLowerCase())
  );
}

// Search designations
export async function searchDesignations(query: string): Promise<string[]> {
  const data = await loadIndustriesDesignations();
  return data.designations.filter(designation =>
    designation.toLowerCase().includes(query.toLowerCase())
  );
}
