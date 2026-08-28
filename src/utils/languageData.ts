// Language proficiency levels
export const languageProficiencyLevels = [
  'Native / Bilingual Proficiency',
  'Full Professional Proficiency', 
  'Professional Working Proficiency',
  'Limited Working Proficiency',
  'Elementary Proficiency'
] as const;

export type LanguageProficiency = typeof languageProficiencyLevels[number];

// Language data structure
export interface LanguageData {
  code: string;
  name: string;
}

// Cache for languages
let languageCache: LanguageData[] | null = null;
let loadedAt: number | null = null;

const TTL_MS = 15 * 60 * 1000; // 15 minutes

// Parse CSV content
function parseLanguagesCSV(csv: string): LanguageData[] {
  const languages: LanguageData[] = [];
  const lines = csv.split('\n').filter(line => line.trim().length > 0);
  
  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line) {
      const [code, name] = line.split(',').map(item => item.trim());
      if (code && name) {
        languages.push({ code, name });
      }
    }
  }
  
  return languages;
}

// Load languages from CSV API
export async function loadLanguages(opts?: { forceReload?: boolean }): Promise<LanguageData[]> {
  const now = Date.now();
  if (!opts?.forceReload && languageCache && loadedAt && now - loadedAt < TTL_MS) {
    return languageCache;
  }
  
  try {
    const res = await fetch('/api/languages', { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const csv = await res.text();
    const languages = parseLanguagesCSV(csv);
    languageCache = languages;
    loadedAt = Date.now();
    return languages;
  } catch (error) {
    console.error('Error loading languages:', error);
    // Fallback to empty array if API fails
    languageCache = [];
    loadedAt = Date.now();
    return [];
  }
}

// Get all languages
export async function getAllLanguages(): Promise<string[]> {
  const languages = await loadLanguages();
  return languages.map(lang => lang.name);
};

// Get language proficiency levels
export const getLanguageProficiencyLevels = (): string[] => {
  return [...languageProficiencyLevels];
};

// Search languages
export async function searchLanguages(query: string, limit = 20): Promise<string[]> {
  const languages = await loadLanguages();
  const q = query.toLowerCase().trim();
  
  if (!q) {
    return languages.slice(0, limit).map(lang => lang.name);
  }
  
  return languages
    .filter(language => 
      language.name.toLowerCase().includes(q) ||
      language.code.toLowerCase().includes(q)
    )
    .slice(0, limit)
    .map(lang => lang.name);
};

// Get language by code
export async function getLanguageByCode(code: string): Promise<string | null> {
  const languages = await loadLanguages();
  const language = languages.find(lang => lang.code.toLowerCase() === code.toLowerCase());
  return language ? language.name : null;
}

// Get language code by name
export async function getLanguageCode(name: string): Promise<string | null> {
  const languages = await loadLanguages();
  const language = languages.find(lang => 
    lang.name.toLowerCase() === name.toLowerCase()
  );
  return language ? language.code : null;
}
