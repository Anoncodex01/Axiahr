import { parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js';
import { locationData } from './locationData';

// Validate a phone number given a dial code like '+255' and the local/national number digits
export function isValidInternationalNumber(dialCode: string, number: string): boolean {
  const country = locationData.getCountryByPhoneCode(dialCode);
  if (!country) return false;
  const parsed = parsePhoneNumberFromString(number.startsWith('+') ? number : `${dialCode}${number}`, country.code as CountryCode);
  return !!parsed?.isValid();
}

// Format a number to international display, e.g. '+255 712 345 678'
export function formatInternational(dialCode: string, number: string): string {
  const country = locationData.getCountryByPhoneCode(dialCode);
  const raw = number.startsWith('+') ? number : `${dialCode}${number}`;
  const parsed = country ? parsePhoneNumberFromString(raw, country.code as CountryCode) : parsePhoneNumberFromString(raw);
  return parsed ? parsed.formatInternational() : raw;
}

// Normalize to E.164 format, e.g. '+255712345678'
export function toE164(dialCode: string, number: string): string | null {
  const country = locationData.getCountryByPhoneCode(dialCode);
  const raw = number.startsWith('+') ? number : `${dialCode}${number}`;
  const parsed = country ? parsePhoneNumberFromString(raw, country.code as CountryCode) : parsePhoneNumberFromString(raw);
  return parsed && parsed.isValid() ? parsed.number : null;
}

// Normalize any user-provided phone input. If it already includes a + prefix, attempt to parse directly.
// Otherwise, try to use the provided fallback dial code (e.g., candidate's own dial code like '+255').
export function normalizeAny(number: string, fallbackDialCode?: string): {
  valid: boolean;
  e164: string | null;
  international: string | null;
} {
  const raw = (number || '').trim();
  if (!raw) return { valid: false, e164: null, international: null };

  // Try parsing as-is (handles inputs that already include +countrycode)
  let parsed = parsePhoneNumberFromString(raw);
  if (!parsed && fallbackDialCode) {
    const country = locationData.getCountryByPhoneCode(fallbackDialCode);
    const composed = raw.startsWith('+') ? raw : `${fallbackDialCode}${raw}`;
    parsed = country ? parsePhoneNumberFromString(composed, country.code as CountryCode) : parsePhoneNumberFromString(composed);
  }

  if (!parsed || !parsed.isValid()) {
    return { valid: false, e164: null, international: null };
  }
  return {
    valid: true,
    e164: parsed.number,
    international: parsed.formatInternational(),
  };
}
