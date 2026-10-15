/**
 * Utility functions for profile completion checks
 */

export const PROFILE_COMPLETION_THRESHOLD = 80;

/**
 * Professional references (and the referee verification email) are switched off for now.
 * Set to true to bring back the wizard step, the profile page section, the referee email,
 * and the references requirement in profile completion / job applications.
 */
export const REFERENCES_ENABLED = false;

/**
 * Normalised view of a candidate profile used by the single shared completion
 * calculation, so the profile page and the profile wizard always show the same %.
 */
export interface ProfileCompletionInput {
  fullName?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  maritalStatus?: string;
  city?: string;
  state?: string;
  country?: string;
  experienceType?: string;
  workExperienceCount: number;
  internshipCount: number;
  educationCount: number;
  resumeHeadline?: string;
  profileSummary?: string;
  resumeUrl?: string;
  skillsCount: number;
  salaryCurrency?: string;
  salaryExpected?: unknown;
  salaryCurrent?: unknown;
  jobType?: string;
  workMode?: string;
  shiftTiming?: string;
  referencesCount: number;
  firstReferenceEmail?: string;
}

export interface ProfileCompletionSections {
  personalInfo: boolean;
  employment: boolean;
  education: boolean;
  salary: boolean;
  profileContent: boolean;
  skills: boolean;
  preferences: boolean;
  references: boolean;
}

const isValidEmail = (email?: string) => !!email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

export function getProfileCompletionSections(p: ProfileCompletionInput): ProfileCompletionSections {
  return {
    personalInfo: Boolean(
      p.fullName && p.email && p.phone && p.dateOfBirth && p.gender && p.maritalStatus &&
      p.city && p.state && p.country
    ),
    employment: p.experienceType === 'fresher' ? p.internshipCount > 0 : p.workExperienceCount > 0,
    education: p.educationCount > 0,
    salary: Boolean(p.salaryCurrency && (p.salaryExpected || p.salaryCurrent)),
    profileContent: Boolean(p.resumeHeadline && (p.profileSummary || p.resumeUrl)),
    skills: p.skillsCount > 0,
    preferences: Boolean(p.jobType && p.workMode && p.shiftTiming),
    references: p.referencesCount > 0 && isValidEmail(p.firstReferenceEmail),
  };
}

export function calculateCompletionPercent(sections: ProfileCompletionSections): number {
  const { references, ...rest } = sections;
  const values = REFERENCES_ENABLED ? [...Object.values(rest), references] : Object.values(rest);
  return Math.round((values.filter(Boolean).length / values.length) * 100);
}

/**
 * Builds the input from /api/candidates/profile `data`. Also tolerates the shapes the
 * profile wizard merges in after each step (e.g. `experiences`, salary form fields).
 */
export function profileCompletionInputFromApi(data: any): ProfileCompletionInput {
  const candidate = data?.candidate || {};
  const profile = data?.profile || {};

  let location = profile.current_location ?? profile.currentLocation;
  if (typeof location === 'string') {
    try {
      location = JSON.parse(location);
    } catch {
      const parts = location.split(',').map((s: string) => s.trim());
      location = { city: parts[0], state: parts.length === 3 ? parts[1] : '', country: parts[parts.length - 1] };
    }
  }
  location = location || {};

  const experiences: any[] = data?.experiences ?? data?.experience ?? [];
  const typeOf = (e: any) => String(e?.experience_type ?? e?.experienceType ?? e?.type ?? 'work').toLowerCase();
  const internshipCount = experiences.filter((e) => ['internship', 'volunteer', 'volunteering'].includes(typeOf(e))).length;

  const salary = data?.salary || {};
  const prefs = data?.jobPreferences || {};
  const references: any[] = data?.references ?? [];

  return {
    fullName: `${candidate.firstName ?? candidate.first_name ?? ''} ${candidate.surname ?? ''}`.trim(),
    email: candidate.email,
    phone: candidate.phone,
    dateOfBirth: profile.date_of_birth ?? profile.dateOfBirth,
    gender: candidate.gender || profile.gender,
    maritalStatus: profile.marital_status ?? profile.maritalStatus,
    city: location.city,
    state: location.state,
    country: location.country,
    experienceType: profile.experience_type ?? profile.experienceType,
    workExperienceCount: experiences.length - internshipCount,
    internshipCount,
    educationCount: (data?.education ?? []).length,
    resumeHeadline: profile.resume_headline,
    profileSummary: profile.profile_summary,
    resumeUrl: data?.resume?.resumeUrl,
    skillsCount: (data?.skills ?? []).length,
    salaryCurrency: salary.currency,
    salaryExpected: salary.expected_salary ?? salary.expectedSalary,
    salaryCurrent: salary.current_salary ?? salary.currentSalary,
    jobType: prefs.jobType,
    workMode: prefs.workMode,
    shiftTiming: prefs.shiftTiming,
    referencesCount: references.length,
    firstReferenceEmail: references[0]?.email,
  };
}

/**
 * Get profile completion percentage from localStorage
 */
export function getProfileCompletionPercent(): number {
  if (typeof window === 'undefined') return 0;
  
  const stored = localStorage.getItem('profileCompletionPercent');
  if (!stored) return 0;
  
  const percent = Number(stored);
  return Number.isNaN(percent) ? 0 : percent;
}

/**
 * Check if profile meets the completion threshold
 */
export function isProfileComplete(): boolean {
  return getProfileCompletionPercent() >= PROFILE_COMPLETION_THRESHOLD;
}

/**
 * Get profile completion message
 */
export function getProfileCompletionMessage(): string {
  const percent = getProfileCompletionPercent();
  const remaining = PROFILE_COMPLETION_THRESHOLD - percent;
  
  if (percent >= PROFILE_COMPLETION_THRESHOLD) {
    return 'Your profile is complete!';
  }
  
  return `Complete ${remaining}% more of your profile to apply for jobs.`;
}

