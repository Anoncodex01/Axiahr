// Nationalities list
export const nationalities = [
  'Afghan', 'Albanian', 'Algerian', 'American', 'Andorran', 'Angolan', 'Antiguan', 'Argentine', 'Armenian', 'Australian', 'Austrian', 'Azerbaijani',
  'Bahamian', 'Bahraini', 'Bangladeshi', 'Barbadian', 'Belarusian', 'Belgian', 'Belizean', 'Beninese', 'Bhutanese', 'Bolivian', 'Bosnian', 'Botswanan', 'Brazilian', 'Bruneian', 'Bulgarian', 'Burkinabé', 'Burundian',
  'Cambodian', 'Cameroonian', 'Canadian', 'Cape Verdean', 'Central African', 'Chadian', 'Chilean', 'Chinese', 'Colombian', 'Comoran', 'Congolese', 'Costa Rican', 'Croatian', 'Cuban', 'Cypriot', 'Czech',
  'Danish', 'Djiboutian', 'Dominican', 'Dutch',
  'Ecuadorian', 'Egyptian', 'Emirati', 'English', 'Equatorial Guinean', 'Eritrean', 'Estonian', 'Ethiopian',
  'Fijian', 'Filipino', 'Finnish', 'French',
  'Gabonese', 'Gambian', 'Georgian', 'German', 'Ghanaian', 'Greek', 'Grenadian', 'Guatemalan', 'Guinean', 'Guyanese',
  'Haitian', 'Honduran', 'Hungarian',
  'Icelander', 'Indian', 'Indonesian', 'Iranian', 'Iraqi', 'Irish', 'Israeli', 'Italian', 'Ivorian',
  'Jamaican', 'Japanese', 'Jordanian',
  'Kazakhstani', 'Kenyan', 'Kittitian', 'Kuwaiti', 'Kyrgyzstani',
  'Laotian', 'Latvian', 'Lebanese', 'Liberian', 'Libyan', 'Liechtensteiner', 'Lithuanian', 'Luxembourger',
  'Macedonian', 'Malagasy', 'Malawian', 'Malaysian', 'Maldivian', 'Malian', 'Maltese', 'Marshallese', 'Mauritanian', 'Mauritian', 'Mexican', 'Micronesian', 'Moldovan', 'Monacan', 'Mongolian', 'Montenegrin', 'Moroccan', 'Mozambican', 'Myanmar',
  'Namibian', 'Nauruan', 'Nepalese', 'New Zealander', 'Nicaraguan', 'Nigerian', 'Nigerien', 'North Korean', 'Norwegian',
  'Omani',
  'Pakistani', 'Palauan', 'Palestinian', 'Panamanian', 'Papua New Guinean', 'Paraguayan', 'Peruvian', 'Polish', 'Portuguese',
  'Qatari',
  'Romanian', 'Russian', 'Rwandan',
  'Saint Lucian', 'Salvadoran', 'Samoan', 'San Marinese', 'Sao Tomean', 'Saudi Arabian', 'Scottish', 'Senegalese', 'Serbian', 'Seychellois', 'Sierra Leonean', 'Singaporean', 'Slovak', 'Slovenian', 'Solomon Islander', 'Somali', 'South African', 'South Korean', 'South Sudanese', 'Spanish', 'Sri Lankan', 'Sudanese', 'Surinamese', 'Swazi', 'Swedish', 'Swiss', 'Syrian',
  'Taiwanese', 'Tajikistani', 'Tanzanian', 'Thai', 'Togolese', 'Tongan', 'Trinidadian', 'Tunisian', 'Turkish', 'Turkmen', 'Tuvaluan',
  'Ugandan', 'Ukrainian', 'Uruguayan', 'Uzbekistani',
  'Vanuatuan', 'Venezuelan', 'Vietnamese',
  'Welsh', 'Yemeni',
  'Zambian', 'Zimbabwean'
];

// Search nationalities
export const searchNationalities = (query: string): string[] => {
  return nationalities.filter(nationality => 
    nationality.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 10);
};

// Job titles organized by categories
export const jobTitles: { [key: string]: string[] } = {
  'Agriculture & Farming': [
    'Agricultural Technician',
    'Aquaculture Technician',
    'Dairy Worker',
    'Farm Labourer',
    'Farmer',
    'Fisherman',
    'Greenhouse Worker',
    'Irrigation Technician',
    'Poultry Worker',
    'Tractor Operator'
  ],
  'Construction & Labour': [
    'Bridge Worker',
    'Concrete Worker',
    'Construction Worker',
    'Demolition Worker',
    'Gardener',
    'General Labourer',
    'Helper Carpenter',
    'Helper Mason',
    'Landscaping Worker',
    'Road Worker',
    'Sandblaster',
    'Scaffolding Helper',
    'Steel Fixer',
    'Stone Cutter',
    'Tunnel Worker'
  ],
  'Construction, Real Estate & Facilities': [
    'Architect',
    'AutoCAD Drafter',
    'Civil Engineer',
    'Construction Manager',
    'Electrical Engineer',
    'Estate Manager',
    'Facility Manager',
    'Foreman',
    'HVAC Engineer',
    'Health and Safety Officer',
    'Junior AutoCAD Drafter',
    'Junior Civil Engineer',
    'Junior Electrical Engineer',
    'Junior HVAC Engineer',
    'Junior MEP Engineer',
    'Junior Mechanical Engineer',
    'Junior Plumbing Engineer',
    'Junior Project Engineer',
    'Junior Quantity Surveyor',
    'Junior Revit Modeler',
    'Junior Site Engineer',
    'Junior Structural Engineer',
    'Lead AutoCAD Drafter',
    'Lead Civil Engineer',
    'Lead Electrical Engineer',
    'Lead HVAC Engineer',
    'Lead MEP Engineer',
    'Lead Mechanical Engineer',
    'Lead Plumbing Engineer',
    'Lead Project Engineer',
    'Lead Quantity Surveyor',
    'Lead Revit Modeler',
    'Lead Site Engineer',
    'Lead Structural Engineer',
    'MEP Engineer',
    'Mechanical Engineer',
    'Plumbing Engineer',
    'Principal AutoCAD Drafter',
    'Principal Civil Engineer',
    'Principal Electrical Engineer',
    'Principal HVAC Engineer',
    'Principal MEP Engineer',
    'Principal Mechanical Engineer',
    'Principal Plumbing Engineer',
    'Principal Project Engineer',
    'Principal Quantity Surveyor',
    'Principal Revit Modeler',
    'Principal Site Engineer',
    'Principal Structural Engineer',
    'Project Engineer',
    'Project Manager (Construction)',
    'Property Manager',
    'Quantity Surveyor',
    'Revit Modeler',
    'Senior AutoCAD Drafter',
    'Senior Civil Engineer',
    'Senior Electrical Engineer',
    'Senior HVAC Engineer',
    'Senior MEP Engineer',
    'Senior Mechanical Engineer',
    'Senior Plumbing Engineer',
    'Senior Project Engineer',
    'Senior Quantity Surveyor',
    'Senior Revit Modeler',
    'Senior Site Engineer',
    'Senior Structural Engineer',
    'Site Engineer',
    'Site Supervisor',
    'Structural Engineer',
    'Surveyor'
  ],
  'Information Technology': [
    'AI Engineer',
    'Android Developer',
    'Backend Developer',
    'Blockchain Developer',
    'Cloud Architect',
    'Cloud Engineer',
    'Computer Programmer',
    'Cybersecurity Analyst',
    'Data Analyst',
    'Data Engineer',
    'Data Scientist',
    'Database Administrator',
    'DevOps Engineer',
    'Frontend Developer',
    'Full Stack Developer',
    'Game Developer',
    'iOS Developer',
    'IT Support Specialist',
    'Machine Learning Engineer',
    'Mobile App Developer',
    'Network Administrator',
    'Product Manager (IT)',
    'Project Manager (IT)',
    'QA Engineer',
    'Software Architect',
    'Software Developer',
    'Software Engineer',
    'System Administrator',
    'UI/UX Designer',
    'Web Developer'
  ],
  'Healthcare & Medical': [
    'Anesthesiologist',
    'Cardiologist',
    'Dentist',
    'Dermatologist',
    'Emergency Medicine Physician',
    'Family Physician',
    'General Practitioner',
    'Gynecologist',
    'Internist',
    'Medical Assistant',
    'Medical Technologist',
    'Neurologist',
    'Nurse',
    'Nurse Practitioner',
    'Obstetrician',
    'Ophthalmologist',
    'Orthopedic Surgeon',
    'Pediatrician',
    'Pharmacist',
    'Physical Therapist',
    'Physician Assistant',
    'Psychiatrist',
    'Radiologist',
    'Registered Nurse',
    'Surgeon',
    'Veterinarian'
  ],
  'Finance & Banking': [
    'Accountant',
    'Actuary',
    'Auditor',
    'Bank Manager',
    'Budget Analyst',
    'Chief Financial Officer',
    'Credit Analyst',
    'Financial Advisor',
    'Financial Analyst',
    'Investment Banker',
    'Loan Officer',
    'Personal Banker',
    'Risk Manager',
    'Tax Advisor',
    'Treasury Analyst'
  ],
  'Education & Training': [
    'Academic Advisor',
    'College Professor',
    'Curriculum Developer',
    'Elementary School Teacher',
    'High School Teacher',
    'Instructional Designer',
    'Librarian',
    'Middle School Teacher',
    'Principal',
    'School Administrator',
    'Special Education Teacher',
    'Training Coordinator',
    'University Professor'
  ],
  'Sales & Marketing': [
    'Account Executive',
    'Brand Manager',
    'Business Development Manager',
    'Content Manager',
    'Digital Marketing Manager',
    'Marketing Analyst',
    'Marketing Coordinator',
    'Marketing Director',
    'Marketing Manager',
    'Product Manager',
    'Sales Director',
    'Sales Manager',
    'Sales Representative',
    'Social Media Manager'
  ],
  'Human Resources': [
    'Benefits Administrator',
    'Compensation Analyst',
    'HR Business Partner',
    'HR Coordinator',
    'HR Director',
    'HR Generalist',
    'HR Manager',
    'HR Specialist',
    'Recruiter',
    'Talent Acquisition Manager',
    'Training and Development Manager'
  ],
  'Operations & Logistics': [
    'Business Analyst',
    'Operations Analyst',
    'Operations Manager',
    'Process Engineer',
    'Project Manager',
    'Quality Assurance Manager',
    'Supply Chain Analyst',
    'Supply Chain Manager',
    'Warehouse Manager'
  ]
};

// Get all job titles
export const getAllJobTitles = (): string[] => {
  return Object.values(jobTitles).flat();
};

// Get job categories
export const getJobCategories = (): string[] => {
  return Object.keys(jobTitles);
};

// Get job titles by category
export const getJobTitlesByCategory = (category: string): string[] => {
  return jobTitles[category] || [];
};

// Search job titles
export const searchJobTitles = (query: string): string[] => {
  const allTitles = getAllJobTitles();
  return allTitles.filter(title => 
    title.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 10);
};

// ==========================
// CSV-backed async utilities
// ==========================

// Cached parsed map from the CSV to avoid re-parsing on every call
let csvJobTitlesCache: { [key: string]: string[] } | null = null;
let csvLoadedAt: number | null = null;

// Simple CSV line parser for two columns: category,title
// Supports categories wrapped in quotes that may contain commas.
const parseCategoryTitle = (line: string): { category: string; title: string } | null => {
  // Skip empty lines
  if (!line || !line.trim()) return null;
  // Header guard
  if (/^\s*category\s*,\s*title\s*$/i.test(line)) return null;

  // Case 1: Quoted category
  const quotedMatch = line.match(/^\s*"([^"]+)"\s*,\s*(.*)\s*$/);
  if (quotedMatch) {
    const category = quotedMatch[1].trim();
    const title = quotedMatch[2].trim();
    if (category && title) return { category, title };
    return null;
  }

  // Case 2: Unquoted category (no commas in category)
  const idx = line.indexOf(',');
  if (idx === -1) return null;
  const category = line.slice(0, idx).trim();
  const title = line.slice(idx + 1).trim();
  if (!category || !title) return null;
  return { category, title };
};

const parseCSVToMap = (csv: string): { [key: string]: string[] } => {
  const map: { [key: string]: string[] } = {};
  // Normalize line endings and split
  const lines = csv.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  for (const raw of lines) {
    const parsed = parseCategoryTitle(raw);
    if (!parsed) continue;
    const { category, title } = parsed;
    if (!map[category]) map[category] = [];
    map[category].push(title);
  }
  return map;
};

// Load CSV from API with caching and fallback to static jobTitles
export const loadJobTitlesFromCSV = async (opts?: { forceReload?: boolean }): Promise<{ [key: string]: string[] }> => {
  const now = Date.now();
  // Simple TTL caching (15 minutes)
  const isFresh = csvJobTitlesCache && csvLoadedAt && now - csvLoadedAt < 15 * 60 * 1000;
  if (!opts?.forceReload && isFresh && csvJobTitlesCache) {
    return csvJobTitlesCache;
  }

  try {
    const res = await fetch('/api/job-titles', { cache: 'no-store' });
    if (!res.ok) throw new Error(`Failed to fetch CSV: ${res.status}`);
    const csvText = await res.text();
    const map = parseCSVToMap(csvText);
    // If parsing failed or empty, keep fallback
    if (Object.keys(map).length === 0) {
      csvJobTitlesCache = { ...jobTitles };
    } else {
      csvJobTitlesCache = map;
    }
    csvLoadedAt = Date.now();
    return csvJobTitlesCache;
  } catch (e) {
    // Fallback to static
    csvJobTitlesCache = { ...jobTitles };
    csvLoadedAt = Date.now();
    return csvJobTitlesCache;
  }
};

// Async equivalents that prefer CSV when available
export const getJobCategoriesAsync = async (): Promise<string[]> => {
  const map = await loadJobTitlesFromCSV();
  return Object.keys(map);
};

export const getJobTitlesByCategoryAsync = async (category: string): Promise<string[]> => {
  const map = await loadJobTitlesFromCSV();
  return map[category] || [];
};

export const getAllJobTitlesAsync = async (): Promise<string[]> => {
  const map = await loadJobTitlesFromCSV();
  return Object.values(map).flat();
};

export const searchJobTitlesAsync = async (query: string): Promise<string[]> => {
  const allTitles = await getAllJobTitlesAsync();
  return allTitles
    .filter(title => title.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 20);
};
