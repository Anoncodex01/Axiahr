/**
 * Utility functions for profile completion checks
 */

export const PROFILE_COMPLETION_THRESHOLD = 80;

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

