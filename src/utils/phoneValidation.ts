/**
 * Utility for Angolan Phone Number Validation (Baza Rápido)
 * 
 * Rules:
 * - Exactly 9 digits
 * - Only numeric characters (0–9)
 * - Must start with 9
 * - Second digit must be 1, 2, 3, 4, 5, or 7 (Valid prefixes: 91, 92, 93, 94, 95, 97)
 */

export const ALLOWED_ANGOLA_PREFIXES = ['91', '92', '93', '94', '95', '97'];

/**
 * Filters input string to keep ONLY numeric digits (0-9) and max 9 characters.
 */
export function formatPhoneInput(value: string): string {
  return value.replace(/\D/g, '').slice(0, 9);
}

/**
 * Checks if a phone number is completely valid:
 * - Exactly 9 digits
 * - Starts with 91, 92, 93, 94, 95, or 97
 */
export function isValidAngolaPhone(phone: string): boolean {
  const clean = phone.replace(/\D/g, '');
  if (clean.length !== 9) return false;
  const prefix = clean.substring(0, 2);
  return ALLOWED_ANGOLA_PREFIXES.includes(prefix);
}

/**
 * Returns a user-friendly error message if invalid, or null if valid.
 */
export function validateAngolaPhone(phone: string): string | null {
  const clean = phone.replace(/\D/g, '');
  if (!clean) {
    return 'Por favor, introduza o número de telefone.';
  }
  if (clean.length !== 9) {
    return 'Número de telefone inválido.';
  }
  const prefix = clean.substring(0, 2);
  if (!ALLOWED_ANGOLA_PREFIXES.includes(prefix)) {
    return 'Número de telefone inválido.';
  }
  return null;
}
