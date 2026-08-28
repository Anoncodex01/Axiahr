// Utilities to load and search universities from CSV served at /api/universities
// CSV format (world-universities.csv sample):
// ISO2,name,website
// e.g. AE,"Khalifa University of Science, Technology and Research",http://www.ku.ac.ae/
// Parser supports quoted names containing commas.

let cache: Array<{ iso2: string; name: string; url?: string }> | null = null;
let loadedAt: number | null = null;

const TTL_MS = 15 * 60 * 1000; // 15 minutes

function parseCSV(csv: string): Array<{ iso2: string; name: string; url?: string }> {
  const rows: Array<{ iso2: string; name: string; url?: string }> = [];
  const text = csv.replace(/\r\n?/g, '\n');
  const lines = text.split('\n').filter(l => l.trim().length > 0);

  const parseLine = (line: string): string[] => {
    const out: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        out.push(cur);
        cur = '';
      } else {
        cur += ch;
      }
    }
    out.push(cur);
    return out.map(s => s.trim());
  };

  for (const line of lines) {
    const cols = parseLine(line);
    if (cols.length < 2) continue;
    // Common format: ISO2, name, url?
    const iso2 = (cols[0] || '').trim();
    const name = (cols[1] || '').trim();
    const url = (cols[2] || '').trim() || undefined;
    if (!iso2 || !name) continue;
    rows.push({ iso2, name, url });
  }
  return rows;
}

export async function loadUniversities(opts?: { forceReload?: boolean }) {
  const now = Date.now();
  if (!opts?.forceReload && cache && loadedAt && now - loadedAt < TTL_MS) return cache;
  try {
    const res = await fetch('/api/universities', { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const csv = await res.text();
    const rows = parseCSV(csv);
    cache = rows;
    loadedAt = Date.now();
    return cache;
  } catch (_e) {
    cache = cache || [];
    loadedAt = Date.now();
    return cache;
  }
}

export async function searchUniversities(query: string, countryISO2?: string, limit = 20) {
  const list = await loadUniversities();
  const q = query.trim().toLowerCase();
  
  if (!q) return [];
  
  let filtered = list;
  if (countryISO2) {
    const cc = countryISO2.toUpperCase();
    filtered = filtered.filter(u => u.iso2.toUpperCase() === cc);
  }
  
  // Common abbreviations for better matching
  const commonAbbreviations: { [key: string]: string[] } = {
    'udom': ['university of dodoma'],
    'udsm': ['university of dar es salaam'],
    'uoa': ['university of arusha'],
    'must': ['mbeya university of science and technology'],
    'saut': ['st. augustine university of tanzania'],
    'cuk': ['catholic university of kenya'],
    'uon': ['university of nairobi'],
    'ku': ['kenyatta university'],
    'mku': ['mount kenya university'],
    'uoe': ['university of eldoret'],
    'mau': ['maseno university'],
    'jkuat': ['jomo kenyatta university of agriculture and technology'],
    'tuk': ['technical university of kenya'],
    'tum': ['technical university of mombasa'],
    'kemu': ['kenya methodist university'],
    'usiu': ['united states international university'],
    'strath': ['strathmore university'],
    'daystar': ['daystar university'],
    'kca': ['kenya college of accountancy'],
    'zetech': ['zetech university'],
    'kabarak': ['kabarak university'],
    'kisii': ['kisii university'],
    'laikipia': ['laikipia university'],
    'machakos': ['machakos university'],
    'meru': ['meru university of science and technology'],
    'multimedia': ['multimedia university of kenya'],
    'pioneer': ['pioneer international university'],
    'presbyterian': ['presbyterian university of east africa'],
    'riara': ['riara university'],
    'south eastern': ['south eastern kenya university'],
    'umma': ['umma university']
  };
  
  // Create a scoring system for better ranking
  const scoredResults = filtered.map(university => {
    const name = university.name.toLowerCase();
    let score = 0;
    
    // Check for abbreviation matches first
    for (const [abbrev, fullNames] of Object.entries(commonAbbreviations)) {
      if (q.includes(abbrev)) {
        for (const fullName of fullNames) {
          if (name.includes(fullName)) {
            score = 900; // High score for abbreviation matches
            break;
          }
        }
      }
    }
    
    // Exact match gets highest score
    if (name === q) {
      score = 1000;
    }
    // Starts with query gets high score
    else if (name.startsWith(q)) {
      score = Math.max(score, 800);
    }
    // Contains query as whole word gets medium-high score
    else if (name.includes(` ${q} `) || name.includes(` ${q}`) || name.includes(`${q} `)) {
      score = Math.max(score, 600);
    }
    // Contains query anywhere gets medium score
    else if (name.includes(q)) {
      score = Math.max(score, 400);
    }
    // Check for word-by-word matching
    else {
      const queryWords = q.split(/\s+/).filter(word => word.length > 0);
      const nameWords = name.split(/\s+/);
      
      let wordMatches = 0;
      for (const queryWord of queryWords) {
        for (const nameWord of nameWords) {
          if (nameWord.includes(queryWord) || queryWord.includes(nameWord)) {
            wordMatches++;
            break;
          }
        }
      }
      
      if (wordMatches > 0) {
        score = Math.max(score, 200 + (wordMatches * 50));
      }
    }
    
    return { university, score };
  });
  
  // Filter out results with score 0 and sort by score (highest first)
  const results = scoredResults
    .filter(result => result.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(result => result.university);
  
  return results.slice(0, limit);
}

export function getQualificationLevels() {
  return [
    'PhD / Doctorate',
    'DBA / Doctor of Business Administration',
    'MD / Medical Doctor',
    'MBBS / Bachelor of Medicine, Bachelor of Surgery',
    "Master's (MS / MSc / MA / MEng / MBA)",
    'MBS / Master of Business Studies',
    'Postgraduate Diploma / Certificate',
    'Graduate Diploma / Certificate',
    "Bachelor's (BS / BSc / BA / BEng)",
    'Advanced Diploma',
    'Higher National Diploma (HND)',
    'Diploma',
    'Certificate',
    'Vocational / Trade Certification',
    'High School / Secondary',
    'Other'
  ];
}

export function getCommonFieldsOfStudy(): string[] {
  return [
    'Computer Science',
    'Software Engineering',
    'Information Technology',
    'Data Science',
    'Artificial Intelligence',
    'Cybersecurity',
    'Business Administration',
    'Accounting',
    'Finance',
    'Economics',
    'Marketing',
    'Human Resource Management',
    'Operations Management',
    'Civil Engineering',
    'Mechanical Engineering',
    'Electrical Engineering',
    'Electronics and Communication',
    'Chemical Engineering',
    'Biomedical Engineering',
    'Architecture',
    'Urban Planning',
    'Medicine',
    'Nursing',
    'Pharmacy',
    'Public Health',
    'Law',
    'International Relations',
    'Political Science',
    'Psychology',
    'Sociology',
    'Education',
    'English Literature',
    'Linguistics',
    'Journalism and Mass Communication',
    'Hospitality and Tourism',
    'Agriculture',
    'Environmental Science',
    'Geology',
    'Biotechnology',
    'Physics',
    'Chemistry',
    'Mathematics',
    'Statistics'
  ];
}

export async function getCommonFieldsOfStudyAsync(searchTerm: string): Promise<string[]> {
  const allFields = getCommonFieldsOfStudy();
  const term = searchTerm.toLowerCase().trim();
  
  if (!term) return allFields;
  
  return allFields.filter(field => 
    field.toLowerCase().includes(term)
  );
}
